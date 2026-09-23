import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { adminOnly } from '../../middleware/admin.middleware.js'
import { db } from '../../db/connection.js'

export const adminRouter = Router()

adminRouter.use(authenticate, adminOnly)

// ========== QUESTIONS ==========

adminRouter.get('/questions', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  const search = (req.query.search as string) || ''
  const flagged = req.query.flagged as string
  const offset = (page - 1) * limit

  let where = ''
  const params: unknown[] = []
  const conditions: string[] = []
  
  if (search) {
    conditions.push('(q.text LIKE ? OR q.answer_1 LIKE ? OR q.answer_2 LIKE ? OR q.answer_3 LIKE ? OR q.answer_4 LIKE ? OR q.note LIKE ? OR t.name LIKE ? OR c.name LIKE ?)')
    const s = `%${search}%`
    params.push(s, s, s, s, s, s, s, s)
  }
  
  if (flagged === '1') {
    conditions.push('q.flagged = 1')
  }
  
  if (conditions.length > 0) {
    where = 'WHERE ' + conditions.join(' AND ')
  }

  const countRow = db.prepare(`SELECT COUNT(*) as c FROM questions q JOIN topics t ON t.id = q.topic_id JOIN categories c ON c.id = t.category_id ${where}`).get(...params) as { c: number }

  const rows = db.prepare(
    `SELECT q.id, q.text, q.answer_1, q.answer_2, q.answer_3, q.answer_4, q.correct_index, q.explanation, q.note, q.image_url, q.flagged,
            t.id as topic_id, t.name as topic_name,
            c.id as category_id, c.name as category_name
     FROM questions q
     JOIN topics t ON t.id = q.topic_id
     JOIN categories c ON c.id = t.category_id
     ${where}
     ORDER BY q.id DESC
     LIMIT ? OFFSET ?`,
  ).all(...params, limit, offset) as Array<{
    id: number; text: string; answer_1: string; answer_2: string; answer_3: string; answer_4: string
    correct_index: number; explanation: string | null; note: string | null; image_url: string | null; flagged: number
    topic_id: number; topic_name: string; category_id: number; category_name: string
  }>

  res.json({
    items: rows,
    total: countRow.c,
    page,
    pages: Math.ceil(countRow.c / limit),
  })
})

adminRouter.get('/questions/:id', (req, res) => {
  const row = db.prepare(
    `SELECT q.*, t.name as topic_name, c.name as category_name
     FROM questions q
     JOIN topics t ON t.id = q.topic_id
     JOIN categories c ON c.id = t.category_id
     WHERE q.id = ?`,
  ).get(req.params.id) as Record<string, unknown> | undefined

  if (!row) { res.status(404).json({ error: 'NOT_FOUND', message: 'Вопрос не найден' }); return }
  res.json(row)
})

adminRouter.put('/questions/:id', (req, res) => {
  const { text, answer_1, answer_2, answer_3, answer_4, correct_index, explanation, note, topic_id, flagged } = req.body
  if (!text) { res.status(400).json({ error: 'INVALID', message: 'text обязателен' }); return }

  const setClauses: string[] = ['text=?', 'answer_1=?', 'answer_2=?', 'answer_3=?', 'answer_4=?', 'correct_index=?', 'explanation=?', 'note=?']
  const params: unknown[] = [text, answer_1 || '', answer_2 || '', answer_3 || '', answer_4 || '', correct_index ?? 0, explanation || null, note || null]

  if (topic_id !== undefined) { setClauses.push('topic_id=?'); params.push(topic_id) }
  if (flagged !== undefined) { setClauses.push('flagged=?'); params.push(flagged) }

  params.push(req.params.id)
  db.prepare(`UPDATE questions SET ${setClauses.join(', ')} WHERE id=?`).run(...params)

  res.json({ ok: true })
})

adminRouter.delete('/questions/:id', (req, res) => {
  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ========== CATEGORIES ==========

adminRouter.get('/categories', (_req, res) => {
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order').all()
  const result = (cats as Array<{ id: number; name: string; icon: string }>).map((cat) => {
    const topics = db.prepare(
      'SELECT t.*, (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id) as question_count FROM topics t WHERE t.category_id = ? ORDER BY t.sort_order',
    ).all(cat.id)
    return { ...cat, topics }
  })
  res.json(result)
})

adminRouter.post('/categories', (req, res) => {
  const { name, icon } = req.body
  if (!name) { res.status(400).json({ error: 'INVALID', message: 'name обязателен' }); return }
  const maxSort = (db.prepare('SELECT MAX(sort_order) as m FROM categories').get() as { m: number }).m || 0
  const result = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)').run(name, icon || '\u00A7', maxSort + 1)
  res.json({ id: result.lastInsertRowid })
})

adminRouter.put('/categories/:id', (req, res) => {
  const { name, icon } = req.body
  db.prepare('UPDATE categories SET name=?, icon=? WHERE id=?').run(name, icon, req.params.id)
  res.json({ ok: true })
})

adminRouter.delete('/categories/:id', (req, res) => {
  db.prepare('DELETE FROM questions WHERE topic_id IN (SELECT id FROM topics WHERE category_id = ?)').run(req.params.id)
  db.prepare('DELETE FROM topics WHERE category_id = ?').run(req.params.id)
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ========== TOPICS ==========

adminRouter.post('/topics', (req, res) => {
  const { name, category_id } = req.body
  if (!name || !category_id) { res.status(400).json({ error: 'INVALID', message: 'name и category_id обязательны' }); return }
  const maxSort = (db.prepare('SELECT MAX(sort_order) as m FROM topics WHERE category_id = ?').get(category_id) as { m: number }).m || 0
  const result = db.prepare('INSERT INTO topics (category_id, name, sort_order) VALUES (?, ?, ?)').run(category_id, name, maxSort + 1)
  res.json({ id: result.lastInsertRowid })
})

adminRouter.put('/topics/:id', (req, res) => {
  const { name, category_id } = req.body
  db.prepare('UPDATE topics SET name=?, category_id=? WHERE id=?').run(name, category_id, req.params.id)
  res.json({ ok: true })
})

adminRouter.delete('/topics/:id', (req, res) => {
  db.prepare('DELETE FROM questions WHERE topic_id = ?').run(req.params.id)
  db.prepare('DELETE FROM topics WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ========== USERS ==========

adminRouter.get('/users', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  const search = (req.query.search as string) || ''
  const offset = (page - 1) * limit

  let where = ''
  const params: unknown[] = []
  if (search) {
    where = 'WHERE login LIKE ? OR nickname LIKE ?'
    const s = `%${search}%`
    params.push(s, s)
  }

  const countRow = db.prepare(`SELECT COUNT(*) as c FROM users ${where}`).get(...params) as { c: number }
  const rows = db.prepare(
    `SELECT id, login, email, nickname, level, icon, is_admin, created_at FROM users ${where} ORDER BY id ASC LIMIT ? OFFSET ?`,
  ).all(...params, limit, offset)

  res.json({ items: rows, total: countRow.c, page, pages: Math.ceil(countRow.c / limit) })
})

adminRouter.put('/users/:id', (req, res) => {
  const { is_admin, nickname } = req.body
  if (typeof is_admin === 'number') {
    db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(is_admin ? 1 : 0, req.params.id)
  }
  if (nickname) {
    db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(nickname, req.params.id)
  }
  res.json({ ok: true })
})
