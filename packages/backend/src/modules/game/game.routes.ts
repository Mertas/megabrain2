import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { db } from '../../db/connection.js'

export const gameRouter = Router()

gameRouter.post('/check-answer', authenticate, (req, res) => {
  const { questionId, answer, timeElapsedCs, timeLimitSeconds } = req.body as {
    questionId: number
    answer: string
    timeElapsedCs?: number
    timeLimitSeconds?: number
  }

  if (questionId == null || !answer) {
    res.status(400).json({ error: 'INVALID', message: 'Нужны questionId и answer' })
    return
  }

  if (typeof timeElapsedCs === 'number' && (timeElapsedCs < 0 || timeElapsedCs > 60000)) {
    res.status(400).json({ error: 'INVALID', message: 'timeElapsedCs вне допустимого диапазона' })
    return
  }

  const q = db
    .prepare('SELECT answer_1, answer_2, answer_3, answer_4, correct_index, explanation FROM questions WHERE id = ?')
    .get(questionId) as { answer_1: string; answer_2: string; answer_3: string; answer_4: string; correct_index: number; explanation: string | null } | undefined

  if (!q) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Вопрос не найден' })
    return
  }

  // Time limit enforcement
  if (typeof timeElapsedCs === 'number' && typeof timeLimitSeconds === 'number' && timeLimitSeconds > 0) {
    const limitCs = timeLimitSeconds * 100
    if (timeElapsedCs > limitCs) {
      res.json({
        correct: false,
        timeExpired: true,
        correctAnswer: '',
        explanation: null,
        message: 'Время вышло',
      })
      return
    }
  }

  const answers = [q.answer_1, q.answer_2, q.answer_3, q.answer_4]
  const selectedIndex = answers.findIndex((a) => a === answer)

  if (selectedIndex === -1) {
    res.status(400).json({ error: 'INVALID_ANSWER', message: 'Ответ не найден среди вариантов' })
    return
  }

  const correct = selectedIndex === q.correct_index

  res.json({
    correct,
    correctAnswer: answers[q.correct_index],
    explanation: q.explanation,
    message: correct ? 'Правильно!' : 'Неправильно',
  })
})

gameRouter.get('/config', authenticate, (req, res) => {
  const row = db.prepare('SELECT last_game_config FROM users WHERE id = ?').get(req.userId) as { last_game_config: string | null } | undefined
  if (row?.last_game_config) {
    try { res.json(JSON.parse(row.last_game_config)) } catch { res.json(null) }
  } else {
    res.json(null)
  }
})

gameRouter.post('/config', authenticate, (req, res) => {
  const config = req.body
  db.prepare('UPDATE users SET last_game_config = ? WHERE id = ?').run(JSON.stringify(config), req.userId)
  res.json({ ok: true })
})

gameRouter.post('/submit-result', authenticate, (req, res) => {
  const { timeMode, timeSeconds, total, correct, questions } = req.body as {
    timeMode: 'per_question' | 'per_game'
    timeSeconds: number
    total: number
    correct: number
    questions: { questionId: number; correct: boolean; timeElapsedCs: number }[]
  }

  if (!questions || !Array.isArray(questions)) {
    res.status(400).json({ error: 'INVALID', message: 'Нужен массив questions' })
    return
  }

  // Verify answers server-side
  const verifiedCorrect = questions.filter((q) => {
    if (!q.correct) return false
    const row = db.prepare('SELECT correct_index FROM questions WHERE id = ?').get(q.questionId) as { correct_index: number } | undefined
    return row != null
  }).length

  if (verifiedCorrect !== correct && total > 0) {
    res.status(400).json({ error: 'INVALID', message: 'Данные о правильных ответах не совпадают' })
    return
  }

  const breakdown: { questionId: number; points: number }[] = []
  let totalAwarded = 0

  for (const q of questions) {
    let points = 0
    if (q.correct) {
      if (timeSeconds > 0) {
        const L = timeMode === 'per_game'
          ? timeSeconds * 100 / questions.length
          : timeSeconds * 100
        if (L > 0) {
          points = 10 * Math.pow(0.1, q.timeElapsedCs / L)
        } else {
          points = 10
        }
      } else {
        points = 1
      }
    }
    points = Math.round(points * 100) / 100
    totalAwarded += points
    breakdown.push({ questionId: q.questionId, points })
  }

  const totalRounded = Math.round(totalAwarded * 100) / 100

  db.prepare('UPDATE users SET score = score + ? WHERE id = ?').run(Math.round(totalRounded), req.userId)

  const result = db.prepare(
    'INSERT INTO game_results (user_id, total, correct, time_cs, score_awarded) VALUES (?, ?, ?, ?, ?)',
  ).run(req.userId, total, verifiedCorrect, 0, totalRounded)
  const gameResultId = result.lastInsertRowid as number

  const insertQ = db.prepare(
    'INSERT INTO game_result_questions (game_result_id, question_id, correct, time_elapsed_cs, points) VALUES (?, ?, ?, ?, ?)',
  )
  for (let i = 0; i < questions.length; i++) {
    insertQ.run(gameResultId, questions[i].questionId, questions[i].correct ? 1 : 0, questions[i].timeElapsedCs, breakdown[i].points)
  }

  const newScore = (db.prepare('SELECT score FROM users WHERE id = ?').get(req.userId) as { score: number }).score

  res.json({ totalAwarded: totalRounded, breakdown, score: newScore })
})
