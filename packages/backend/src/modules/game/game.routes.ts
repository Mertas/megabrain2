import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { db } from '../../db/connection.js'

export const gameRouter = Router()

gameRouter.post('/check-answer', authenticate, (req, res) => {
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
