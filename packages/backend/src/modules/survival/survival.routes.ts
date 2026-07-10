import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { db } from '../../db/connection.js'
import { verifyAccessToken } from '../../lib/jwt.js'
import {
  SURVIVAL_CONFIG,
  getDifficulty,
  getTimeLimit,
  calcSurvivalPoints,
  fetchSurvivalQuestion,
  saveSurvivalGame,
  getSurvivalLeaderboard,
  getSurvivalUserRank,
} from './survival.service.js'
import {
  createSession,
  getSession,
  deleteSession,
  touchSession,
} from './survival.session.js'

export const survivalRouter = Router()

survivalRouter.get('/config', (_req, res) => {
  res.json(SURVIVAL_CONFIG)
})

survivalRouter.post('/start', authenticate, (req, res) => {
  const { topicIds } = req.body as { topicIds: number[] }

  if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
    res.status(400).json({ error: 'INVALID', message: 'Нужен массив topicIds' })
    return
  }

  const sessionId = randomUUID()
  const session = createSession(sessionId, req.userId!, topicIds)

  const question = fetchSurvivalQuestion(topicIds, session.difficulty, [])
  if (!question) {
    deleteSession(sessionId)
    res.status(404).json({ error: 'NO_QUESTIONS', message: 'Нет вопросов по выбранным темам' })
    return
  }

  session.askedQuestionIds.add(question.id)
  touchSession(sessionId)

  res.json({
    sessionId,
    question: {
      id: question.id,
      text: question.text,
      imageUrl: question.image_url,
      answers: question.answers,
      note: question.note,
    },
    questionNumber: 1,
    timeLimitSeconds: session.timeLimitSeconds,
    lives: session.lives,
    streak: session.streak,
    score: session.score,
    difficulty: session.difficulty,
  })
})

survivalRouter.post('/answer', authenticate, (req, res) => {
  const { sessionId, questionId, answer, timeElapsedCs, powerup } = req.body as {
    sessionId: string
    questionId: number
    answer: string
    timeElapsedCs: number
    powerup?: string
  }

  if (!sessionId || questionId == null || !answer) {
    res.status(400).json({ error: 'INVALID', message: 'Нужны sessionId, questionId, answer' })
    return
  }

  const session = getSession(sessionId)
  if (!session) {
    res.status(404).json({ error: 'SESSION_NOT_FOUND', message: 'Сессия не найдена или истекла' })
    return
  }

  if (session.userId !== req.userId) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Чужая сессия' })
    return
  }

  touchSession(sessionId)

  // Fetch correct answer from DB
  const dbQuestion = db.prepare(
    'SELECT answer_1, answer_2, answer_3, answer_4, correct_index, explanation FROM questions WHERE id = ?',
  ).get(questionId) as {
    answer_1: string; answer_2: string; answer_3: string; answer_4: string
    correct_index: number; explanation: string | null
  } | undefined

  if (!dbQuestion) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Вопрос не найден' })
    return
  }

  const dbAnswers = [dbQuestion.answer_1, dbQuestion.answer_2, dbQuestion.answer_3, dbQuestion.answer_4]
  const correctAnswerText = dbAnswers[dbQuestion.correct_index]
  const isSkip = answer === ''
  let selectedCorrect = (answer === correctAnswerText)

  const effectiveCs = typeof timeElapsedCs === 'number' && timeElapsedCs >= 0
    ? Math.min(timeElapsedCs, session.timeLimitSeconds * 100)
    : 0

  let newStreak: number
  let newLives: number
  let isGameOver = false
  let extraLifeAwarded = false
  let powerupUsed = powerup || null

  // Handle shield: wrong answer becomes correct (no points, no streak)
  if (!selectedCorrect && powerup === 'shield' && !isSkip) {
    selectedCorrect = true
    effectiveCs // keep the same time
  }

  if (selectedCorrect) {
    newStreak = session.streak + 1
    if (newStreak > session.maxStreak) session.maxStreak = newStreak

    newLives = session.lives
    if (newStreak > 0 && newStreak % SURVIVAL_CONFIG.extraLifeEvery === 0 && newLives < SURVIVAL_CONFIG.maxLives) {
      newLives++
      extraLifeAwarded = true
    }
  } else {
    // Streak-saver: halve the streak instead of resetting
    if (powerup === 'streak-saver' && session.streak > 0 && !isSkip) {
      newStreak = Math.floor(session.streak / 2)
    } else {
      newStreak = 0
    }
    // Skip-safe: skip doesn't cost a life
    if (powerup === 'skip-safe' && isSkip) {
      newLives = session.lives
    } else {
      newLives = session.lives - 1
    }
    if (newLives <= 0) {
      isGameOver = true
      newLives = 0
    }
  }

  const points = powerupUsed ? 0 : calcSurvivalPoints(effectiveCs, session.timeLimitSeconds, selectedCorrect, session.streak)

  const newDifficulty = getDifficulty(newStreak)
  const newTimeLimit = getTimeLimit(newStreak)

  const questionRecord = {
    questionId,
    questionIndex: session.totalQuestions + 1,
    correct: selectedCorrect,
    timeElapsedCs: effectiveCs,
    points,
    streakAtMoment: session.streak,
    difficulty: session.difficulty,
  }

  session.streak = newStreak
  session.lives = newLives
  session.score = Math.round((session.score + points) * 100) / 100
  session.totalQuestions++
  if (selectedCorrect) session.correctAnswers++
  else session.wrongAnswers++
  session.difficulty = newDifficulty
  session.timeLimitSeconds = newTimeLimit
  session.questions.push(questionRecord)

  if (isGameOver) {
    const saveResult = saveSurvivalGame({
      userId: session.userId,
      topicIds: session.topicIds,
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      wrongAnswers: session.wrongAnswers,
      maxStreak: session.maxStreak,
      finalStreak: session.streak,
      livesLeft: session.lives,
      totalScore: session.score,
      totalTimeCs: 0,
      difficultyReached: session.difficulty === 'easy' ? 1 : session.difficulty === 'medium' ? 2 : 3,
      questions: session.questions.map((q) => ({
        questionId: q.questionId,
        questionIndex: q.questionIndex,
        correct: q.correct,
        timeElapsedCs: q.timeElapsedCs,
        points: q.points,
        streakAtMoment: q.streakAtMoment,
        difficultyLevel: q.difficulty === 'easy' ? 1 : q.difficulty === 'medium' ? 2 : 3,
      })),
    })

    const rank = getSurvivalUserRank(session.userId)
    

    deleteSession(sessionId)

    res.json({
      gameOver: true,
      correct: selectedCorrect,
      correctAnswer: correctAnswerText,
      explanation: dbQuestion.explanation,
      
      summary: {
        totalQuestions: session.totalQuestions,
        correctAnswers: session.correctAnswers,
        wrongAnswers: session.wrongAnswers,
        maxStreak: session.maxStreak,
        finalStreak: session.streak,
        totalScore: session.score,
        difficultyReached: session.difficulty,
        isNewPersonalBestScore: saveResult.isNewBestScore,
        isNewPersonalBestStreak: saveResult.isNewBestStreak,
        rank: rank?.rank ?? null,
      },
    })
    return
  }

  // Fetch next question
  const nextQuestion = fetchSurvivalQuestion(
    session.topicIds,
    session.difficulty,
    Array.from(session.askedQuestionIds),
  )
  if (!nextQuestion) {
    // No more questions — end game gracefully
    const saveResult = saveSurvivalGame({
      userId: session.userId,
      topicIds: session.topicIds,
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      wrongAnswers: session.wrongAnswers,
      maxStreak: session.maxStreak,
      finalStreak: session.streak,
      livesLeft: session.lives,
      totalScore: session.score,
      totalTimeCs: 0,
      difficultyReached: session.difficulty === 'easy' ? 1 : session.difficulty === 'medium' ? 2 : 3,
      questions: session.questions.map((q) => ({
        questionId: q.questionId,
        questionIndex: q.questionIndex,
        correct: q.correct,
        timeElapsedCs: q.timeElapsedCs,
        points: q.points,
        streakAtMoment: q.streakAtMoment,
        difficultyLevel: q.difficulty === 'easy' ? 1 : q.difficulty === 'medium' ? 2 : 3,
      })),
    })
    const rank = getSurvivalUserRank(session.userId)
    deleteSession(sessionId)

    res.json({
      gameOver: true,
      correct: selectedCorrect,
      correctAnswer: correctAnswerText,
      explanation: dbQuestion.explanation,
      summary: {
        totalQuestions: session.totalQuestions,
        correctAnswers: session.correctAnswers,
        wrongAnswers: session.wrongAnswers,
        maxStreak: session.maxStreak,
        finalStreak: session.streak,
        totalScore: session.score,
        difficultyReached: session.difficulty,
        isNewPersonalBestScore: saveResult.isNewBestScore,
        isNewPersonalBestStreak: saveResult.isNewBestStreak,
        rank: rank?.rank ?? null,
      },
    })
    return
  }

  session.askedQuestionIds.add(nextQuestion.id)
  touchSession(sessionId)

  res.json({
    gameOver: false,
    correct: selectedCorrect,
    correctAnswer: correctAnswerText,
    explanation: dbQuestion.explanation,
    pointsAwarded: points,
    totalScore: session.score,
    lives: session.lives,
    streak: session.streak,
    streakMultiplier: 1 + Math.floor(session.streak / SURVIVAL_CONFIG.streakMultiplierStep) * 0.25,
    extraLifeAwarded,
    nextQuestion: {
      id: nextQuestion.id,
      text: nextQuestion.text,
      imageUrl: nextQuestion.image_url,
      answers: nextQuestion.answers,
      note: nextQuestion.note,
    },
    questionNumber: session.totalQuestions + 1,
    timeLimitSeconds: newTimeLimit,
    difficulty: newDifficulty,
  })
})

survivalRouter.post('/finish', authenticate, (req, res) => {
  const { sessionId } = req.body as { sessionId: string }

  if (!sessionId) {
    res.status(400).json({ error: 'INVALID', message: 'Нужен sessionId' })
    return
  }

  const session = getSession(sessionId)
  if (!session) {
    res.status(404).json({ error: 'SESSION_NOT_FOUND', message: 'Сессия не найдена или истекла' })
    return
  }

  if (session.userId !== req.userId) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Чужая сессия' })
    return
  }

  if (session.totalQuestions === 0) {
    deleteSession(sessionId)
    res.json({ saved: false, message: 'Нет ответов для сохранения' })
    return
  }

  const saveResult = saveSurvivalGame({
    userId: session.userId,
    topicIds: session.topicIds,
    totalQuestions: session.totalQuestions,
    correctAnswers: session.correctAnswers,
    wrongAnswers: session.wrongAnswers,
    maxStreak: session.maxStreak,
    finalStreak: session.streak,
    livesLeft: session.lives,
    totalScore: session.score,
    totalTimeCs: 0,
    difficultyReached: session.difficulty === 'easy' ? 1 : session.difficulty === 'medium' ? 2 : 3,
    questions: session.questions.map((q) => ({
      questionId: q.questionId,
      questionIndex: q.questionIndex,
      correct: q.correct,
      timeElapsedCs: q.timeElapsedCs,
      points: q.points,
      streakAtMoment: q.streakAtMoment,
      difficultyLevel: q.difficulty === 'easy' ? 1 : q.difficulty === 'medium' ? 2 : 3,
    })),
  })
  const rank = getSurvivalUserRank(session.userId)
  deleteSession(sessionId)

  res.json({
    saved: true,
    summary: {
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      wrongAnswers: session.wrongAnswers,
      maxStreak: session.maxStreak,
      finalStreak: session.streak,
      totalScore: session.score,
      difficultyReached: session.difficulty,
      isNewPersonalBestScore: saveResult.isNewBestScore,
      isNewPersonalBestStreak: saveResult.isNewBestStreak,
      rank: rank?.rank ?? null,
    },
  })
})

survivalRouter.get('/leaderboard', (req, res) => {
  const period = (req.query.period as string) || 'all'
  const limit = parseInt(req.query.limit as string) || 50
  if (!['all', 'weekly', 'daily'].includes(period)) {
    res.status(400).json({ error: 'INVALID', message: 'period должен быть all, weekly или daily' })
    return
  }

  const entries = getSurvivalLeaderboard(period as 'all' | 'weekly' | 'daily', limit)

  let userRank: { rank: number; score: number } | null = null
  if (req.headers.authorization) {
    try {
      const token = req.headers.authorization.replace('Bearer ', '')
      const payload = verifyAccessToken(token) as { userId: number }
      if (payload?.userId) {
        const ur = getSurvivalUserRank(payload.userId)
        if (ur) userRank = ur
      }
    } catch { /* ignore — user not logged in */ }
  }

  res.json({ period, entries, userRank })
})
