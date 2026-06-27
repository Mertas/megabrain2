import { Router } from 'express'
import { getCategories, getQuestions } from './topics.service.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { db } from '../../db/connection.js'

export const topicsRouter = Router()

topicsRouter.get('/', (_req, res) => {
  const categories = getCategories()
  res.json(categories)
})

topicsRouter.get('/questions', (req, res) => {
  const ids = (req.query.topicIds as string)?.split(',').map(Number).filter(Boolean) || []
  const count = req.query.count ? parseInt(req.query.count as string, 10) : 0
  const hideAnswer = req.query.hideAnswer === 'true'

  if (ids.length === 0) {
    res.json([])
    return
  }

  const questions = getQuestions(ids, count, hideAnswer)
  res.json(questions)
})

topicsRouter.post('/questions/bulk', authenticate, (req, res) => {
  const { topicId, questions } = req.body as {
    topicId: number
    questions: { text: string; answers: string[]; correctIndex: number; note?: string }[]
  }

  if (!topicId || !questions || !Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({ error: 'INVALID', message: 'Нужны topicId и массив questions' })
    return
  }

  const stmt = db.prepare(
    'INSERT INTO questions (topic_id, text, answer_1, answer_2, answer_3, answer_4, correct_index, author_id, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )

  let added = 0
  for (const q of questions) {
    if (!q.text || !q.answers || q.answers.length < 2) continue
    const answers = q.answers.slice(0, 4)
    while (answers.length < 4) answers.push('')
    stmt.run(topicId, q.text, answers[0], answers[1], answers[2], answers[3], q.correctIndex, req.userId, q.note || null)
    added++
  }

  res.json({ added })
})
