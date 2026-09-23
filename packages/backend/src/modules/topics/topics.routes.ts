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
  const { topicId, questions, dryRun, insert, update } = req.body as {
    topicId: number
    questions?: { text: string; answers: string[]; correctIndex: number; note?: string }[]
    dryRun?: boolean
    insert?: { text: string; answers: string[]; correctIndex: number; note?: string }[]
    update?: { id: number; text: string; answers: string[]; correctIndex: number; note?: string }[]
  }

  // Phase 2: actual insert/update
  if (insert || update) {
    let added = 0
    let updated = 0

    if (insert) {
      const stmt = db.prepare(
        'INSERT INTO questions (topic_id, text, answer_1, answer_2, answer_3, answer_4, correct_index, author_id, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      for (const q of insert) {
        if (!q.text || !q.answers || q.answers.length < 2) continue
        const a = q.answers.slice(0, 4)
        while (a.length < 4) a.push('')
        stmt.run(topicId, q.text, a[0], a[1], a[2], a[3], q.correctIndex, req.userId, q.note || null)
        added++
      }
    }

    if (update) {
      const updStmt = db.prepare(
        'UPDATE questions SET text=?, answer_1=?, answer_2=?, answer_3=?, answer_4=?, correct_index=?, note=? WHERE id=?',
      )
      for (const q of update) {
        if (!q.id || !q.text) continue
        const a = q.answers.slice(0, 4)
        while (a.length < 4) a.push('')
        updStmt.run(q.text, a[0], a[1], a[2], a[3], q.correctIndex, q.note || null, q.id)
        updated++
      }
    }

    res.json({ added, updated })
    return
  }

  // Phase 1: validation (dryRun or implicit from questions array)
  if (!topicId || !questions || !Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({ error: 'INVALID', message: 'Нужны topicId и массив questions' })
    return
  }

  const existing = db.prepare(
    'SELECT id, text, answer_1, answer_2, answer_3, answer_4, correct_index, note FROM questions WHERE topic_id = ?',
  ).all(topicId) as Array<{
    id: number; text: string
    answer_1: string; answer_2: string; answer_3: string; answer_4: string
    correct_index: number; note: string | null
  }>

  type QData = {
    text: string; answers: string[]; correctIndex: number; note?: string
  }
  type Candidate = 
    | { source: 'new'; index: number; question: QData }
    | { source: 'existing'; id: number; question: QData; matchField: string }

  function isMatch(a: QData, b: QData): string | null {
    if (a.text.toLowerCase().includes(b.text.toLowerCase()) || b.text.toLowerCase().includes(a.text.toLowerCase())) return 'text'
    const ca = a.answers[a.correctIndex] || ''
    const cb = b.answers[b.correctIndex] || ''
    if (ca && cb && ca.toLowerCase() === cb.toLowerCase()) return 'correctAnswer'
    return null
  }

  const groups: Array<{ candidates: Candidate[] }> = []

  const processed = new Set<number>()
  const inGroup = new Set<number>()

  for (let i = 0; i < questions.length; i++) {
    if (processed.has(i)) continue
    const q = questions[i]
    if (!q.text || !q.answers || q.answers.length < 2) continue

    const qData: QData = { text: q.text, answers: q.answers.slice(0, 4), correctIndex: q.correctIndex, note: q.note }
    const candidates: Candidate[] = [{ source: 'new', index: i, question: qData }]
    processed.add(i)

    for (let j = i + 1; j < questions.length; j++) {
      if (processed.has(j)) continue
      const q2 = questions[j]
      if (!q2.text || !q2.answers || q2.answers.length < 2) continue
      const q2Data: QData = { text: q2.text, answers: q2.answers.slice(0, 4), correctIndex: q2.correctIndex, note: q2.note }
      const mf = isMatch(qData, q2Data)
      if (mf) {
        candidates.push({ source: 'new', index: j, question: q2Data })
        processed.add(j)
      }
    }

    for (const ex of existing) {
      const exData: QData = {
        text: ex.text,
        answers: [ex.answer_1, ex.answer_2, ex.answer_3, ex.answer_4],
        correctIndex: ex.correct_index,
        note: ex.note || undefined,
      }
      const mf = isMatch(qData, exData)
      if (mf) {
        candidates.push({ source: 'existing', id: ex.id, question: exData, matchField: mf })
      }
    }

    if (candidates.length > 1) {
      groups.push({ candidates })
      for (const c of candidates) {
        if (c.source === 'new') inGroup.add(c.index!)
      }
    }
  }

  const cleanIndices: number[] = []
  for (let i = 0; i < questions.length; i++) {
    if (inGroup.has(i)) continue
    const q = questions[i]
    if (q.text && q.answers && q.answers.length >= 2) cleanIndices.push(i)
  }

  res.json({ groups, cleanIndices })
})

topicsRouter.post('/questions/:id/flag', authenticate, (req, res) => {
  const id = parseInt(req.params.id as string)
  const question = db.prepare('SELECT id, flagged FROM questions WHERE id = ?').get(id) as { id: number; flagged: number } | undefined
  if (!question) { res.status(404).json({ error: 'NOT_FOUND' }); return }

  const newFlag = question.flagged ? 0 : 1
  db.prepare('UPDATE questions SET flagged = ? WHERE id = ?').run(newFlag, id)
  res.json({ id, flagged: newFlag })
})
