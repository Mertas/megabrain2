import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { db } from '../../db/connection.js'

export const usersRouter = Router()

// Public list
usersRouter.get('/', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 30
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
    `SELECT u.id, u.login, u.nickname, u.level, u.icon, u.created_at,
            COALESCE(e.rating, 1000) as elo,
            (SELECT COUNT(*) FROM questions WHERE author_id = u.id) as authored_count
     FROM users u
     LEFT JOIN elo_ratings e ON e.user_id = u.id
     ${where}
     ORDER BY u.level DESC, u.login ASC
     LIMIT ? OFFSET ?`,
  ).all(...params, limit, offset) as Array<{
    id: number; login: string; nickname: string; level: number; icon: string; created_at: string; elo: number; authored_count: number
  }>

  res.json({
    items: rows.map((r) => ({
      id: r.id,
      login: r.login,
      nickname: r.nickname,
      level: r.level,
      icon: r.icon,
      elo: r.elo,
      authoredCount: r.authored_count,
    })),
    total: countRow.c,
    page,
    pages: Math.ceil(countRow.c / limit),
  })
})

// Public profile
usersRouter.get('/:login', (req, res) => {
  const login = req.params.login as string

  const user = db.prepare(
    `SELECT u.id, u.login, u.nickname, u.level, u.icon, u.score, u.created_at, COALESCE(e.rating, 1000) as elo
     FROM users u
     LEFT JOIN elo_ratings e ON e.user_id = u.id
     WHERE u.login = ?`,
  ).get(login) as { id: number; login: string; nickname: string; level: number; icon: string; score: number; elo: number; created_at: string } | undefined

  if (!user) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Пользователь не найден' })
    return
  }

  res.json({
    id: user.id,
    login: user.login,
    nickname: user.nickname,
    level: user.level,
    icon: user.icon,
    score: user.score,
    elo: user.elo,
    name: user.nickname,
    location: '',
    firstSeen: `c ${new Date(user.created_at).toLocaleDateString('ru-RU')}`,
    topics: getTopics(),
    stats: getStats(user.id),
  })
})

// Update own profile
usersRouter.patch('/:id', authenticate, (req, res) => {
  const { nickname, icon } = req.body as { nickname?: string; icon?: string }
  const userId = parseInt(req.params.id as string)

  if (req.userId !== userId) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Можно редактировать только свой профиль' })
    return
  }

  if (nickname) {
    db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(nickname, userId)
  }

  const user = db.prepare(
    `SELECT u.id, u.login, u.nickname, u.level, u.icon, u.score, u.created_at, COALESCE(e.rating, 1000) as elo
     FROM users u LEFT JOIN elo_ratings e ON e.user_id = u.id WHERE u.id = ?`,
  ).get(userId) as { id: number; login: string; nickname: string; level: number; icon: string; score: number; created_at: string; elo: number }
  res.json({
    id: user.id,
    login: user.login,
    nickname: user.nickname,
    level: user.level,
    icon: user.icon,
    score: user.score,
    elo: user.elo,
    name: user.nickname,
    location: '',
    firstSeen: `c ${new Date(user.created_at).toLocaleDateString('ru-RU')}`,
    topics: getTopics(),
    stats: getStats(userId),
  })
})

function getTopics() {
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order').all() as Array<{ id: number; name: string }>
  return cats.map((cat) => {
    const subtopics = db.prepare('SELECT name FROM topics WHERE category_id = ? ORDER BY sort_order').all(cat.id) as Array<{ name: string }>
    return { name: cat.name, subtopics: subtopics.map((t) => t.name) }
  })
}

function getStats(userId: number) {
  const authored = (db.prepare('SELECT COUNT(*) as c FROM questions WHERE author_id = ?').get(userId) as { c: number }).c

  const gameRow = db.prepare(
    `SELECT COUNT(*) as played, COALESCE(SUM(total), 0) as total_questions, COALESCE(SUM(correct), 0) as total_correct, COALESCE(SUM(score_awarded), 0) as total_score
     FROM game_results WHERE user_id = ?`,
  ).get(userId) as { played: number; total_questions: number; total_correct: number; total_score: number }

  const recent = db.prepare(
    `SELECT id, total, correct, score_awarded, created_at FROM game_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
  ).all(userId) as Array<{ id: number; total: number; correct: number; score_awarded: number; created_at: string }>

  const accuracy = gameRow.total_questions > 0 ? Math.round((gameRow.total_correct / gameRow.total_questions) * 100) : 0

  return {
    questionsAuthored: authored,
    gamesPlayed: gameRow.played,
    totalQuestions: gameRow.total_questions,
    totalCorrect: gameRow.total_correct,
    accuracy,
    totalScore: Math.round(gameRow.total_score * 100) / 100,
    recent: recent.map((g) => ({
      id: g.id,
      total: g.total,
      correct: g.correct,
      score: Math.round(g.score_awarded * 100) / 100,
      date: g.created_at,
    })),
  }
}
