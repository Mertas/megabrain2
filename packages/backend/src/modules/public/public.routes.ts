import { Router } from 'express'
import { db } from '../../db/connection.js'

export const publicRouter = Router()

publicRouter.get('/random-question', (_req, res) => {
  const topic = db
    .prepare(
      `SELECT t.id, t.name, c.name as category_name
       FROM topics t
       JOIN categories c ON c.id = t.category_id
       ORDER BY RANDOM()
       LIMIT 1`,
    )
    .get() as { id: number; name: string; category_name: string } | undefined

  if (!topic) {
    res.status(404).json({ error: 'NO_TOPICS', message: 'Нет тем' })
    return
  }

  const row = db
    .prepare(
      `SELECT id, text, image_url, answer_1, answer_2, answer_3, answer_4, correct_index, explanation, note
       FROM questions
       WHERE topic_id = ?
       ORDER BY RANDOM()
       LIMIT 1`,
    )
    .get(topic.id) as {
      id: number; text: string; image_url: string | null
      answer_1: string; answer_2: string; answer_3: string; answer_4: string
      correct_index: number; explanation: string | null; note: string | null
    } | undefined

  if (!row) {
    res.status(404).json({ error: 'NO_QUESTIONS', message: 'В этой теме нет вопросов' })
    return
  }

  const answers = [row.answer_1, row.answer_2, row.answer_3, row.answer_4]

  // Shuffle answers
  const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5)
  const shuffled = indices.map((i) => answers[i])
  const correctAnswer = answers[row.correct_index]
  const shuffledCorrect = shuffled.indexOf(correctAnswer)

  res.json({
    question: {
      id: row.id,
      text: row.text,
      imageUrl: row.image_url,
      answers: shuffled,
      correctIndex: -1, // never send correct to client
      note: row.note,
    },
    topic: {
      id: topic.id,
      name: topic.name,
      categoryName: topic.category_name,
    },
  })
})

publicRouter.post('/check-answer', (req, res) => {
  const { questionId, answer } = req.body as {
    questionId: number
    answer: string
  }

  if (questionId == null || !answer) {
    res.status(400).json({ error: 'INVALID', message: 'Нужны questionId и answer' })
    return
  }

  const q = db
    .prepare('SELECT answer_1, answer_2, answer_3, answer_4, correct_index, explanation FROM questions WHERE id = ?')
    .get(questionId) as { answer_1: string; answer_2: string; answer_3: string; answer_4: string; correct_index: number; explanation: string | null } | undefined

  if (!q) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Вопрос не найден' })
    return
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
