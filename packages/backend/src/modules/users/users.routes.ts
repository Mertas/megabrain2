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

  // Solo mode
  const soloRow = db.prepare(
    `SELECT COUNT(*) as played, COALESCE(SUM(total), 0) as total_questions, COALESCE(SUM(correct), 0) as total_correct, COALESCE(SUM(score_awarded), 0) as total_score
     FROM game_results WHERE user_id = ?`,
  ).get(userId) as { played: number; total_questions: number; total_correct: number; total_score: number }

  const soloAccuracy = soloRow.total_questions > 0 ? Math.round((soloRow.total_correct / soloRow.total_questions) * 100) : 0
  const soloAvgScore = soloRow.played > 0 ? Math.round((soloRow.total_score / soloRow.played) * 100) / 100 : 0

  // PvP mode
  const pvpRow = db.prepare(
    `SELECT COUNT(*) as played,
            COALESCE(SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END), 0) as wins,
            COALESCE(SUM(CASE WHEN winner_id IS NULL THEN 1 ELSE 0 END), 0) as draws
     FROM pvp_games WHERE player1_id = ? OR player2_id = ?`,
  ).get(userId, userId, userId) as { played: number; wins: number; draws: number }
  const pvpLosses = pvpRow.played - pvpRow.wins - pvpRow.draws

  const eloRow = db.prepare('SELECT rating, wins, losses, draws FROM elo_ratings WHERE user_id = ?').get(userId) as { rating: number; wins: number; losses: number; draws: number } | undefined

  // Blitz mode
  const blitzRow = db.prepare(
    `SELECT COUNT(*) as played,
            COALESCE(SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END), 0) as wins,
            COALESCE(SUM(CASE WHEN winner_id IS NULL THEN 1 ELSE 0 END), 0) as draws
     FROM blitz_games WHERE player1_id = ? OR player2_id = ?`,
  ).get(userId, userId, userId) as { played: number; wins: number; draws: number }
  const blitzLosses = blitzRow.played - blitzRow.wins - blitzRow.draws

  const blitzEloRow = db.prepare('SELECT rating, wins, losses, draws FROM blitz_ratings WHERE user_id = ?').get(userId) as { rating: number; wins: number; losses: number; draws: number } | undefined

  // Survival mode
  const survRow = db.prepare(
    `SELECT COUNT(*) as played,
            COALESCE(SUM(total_questions), 0) as total_questions,
            COALESCE(SUM(correct_answers), 0) as total_correct,
            COALESCE(SUM(total_score), 0) as total_score
     FROM survival_games WHERE user_id = ?`,
  ).get(userId) as { played: number; total_questions: number; total_correct: number; total_score: number }
  const survAccuracy = survRow.total_questions > 0 ? Math.round((survRow.total_correct / survRow.total_questions) * 100) : 0
  const survAvgScore = survRow.played > 0 ? Math.round((survRow.total_score / survRow.played) * 100) / 100 : 0

  const bestSurv = db.prepare('SELECT best_survival_score, best_survival_streak FROM users WHERE id = ?').get(userId) as { best_survival_score: number; best_survival_streak: number }

  // Totals
  const totalGames = soloRow.played + pvpRow.played + blitzRow.played + survRow.played
  const totalQuestions = soloRow.total_questions + survRow.total_questions
  const totalCorrect = soloRow.total_correct + survRow.total_correct
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  // Recent 10 games across all formats
  interface RecentRow { id: number; total: number; correct: number; score: number; date: string; format: string }
  const recentQuery = `
    SELECT id, total, correct, score_awarded as score, created_at as date, 'solo' as format FROM game_results WHERE user_id = ?
    UNION ALL
    SELECT id, 0 as total, CASE WHEN winner_id = ? THEN 1 ELSE 0 END as correct, score_p1 as score, created_at as date, 'pvp' as format FROM pvp_games WHERE player1_id = ?
    UNION ALL
    SELECT id, 0 as total, CASE WHEN winner_id = ? THEN 1 ELSE 0 END as correct, score_p2 as score, created_at as date, 'pvp' as format FROM pvp_games WHERE player2_id = ?
    UNION ALL
    SELECT id, 0 as total, CASE WHEN winner_id = ? THEN 1 ELSE 0 END as correct, score_p1 as score, created_at as date, 'blitz' as format FROM blitz_games WHERE player1_id = ?
    UNION ALL
    SELECT id, 0 as total, CASE WHEN winner_id = ? THEN 1 ELSE 0 END as correct, score_p2 as score, created_at as date, 'blitz' as format FROM blitz_games WHERE player2_id = ?
    UNION ALL
    SELECT id, total_questions as total, correct_answers as correct, total_score as score, created_at as date, 'survival' as format FROM survival_games WHERE user_id = ?
    ORDER BY date DESC LIMIT 10
  `
  const recent = db.prepare(recentQuery).all(userId, userId, userId, userId, userId, userId, userId, userId, userId, userId) as RecentRow[]

  return {
    questionsAuthored: authored,
    totalGames,
    totalQuestions,
    totalCorrect,
    overallAccuracy,
    solo: {
      gamesPlayed: soloRow.played,
      totalQuestions: soloRow.total_questions,
      totalCorrect: soloRow.total_correct,
      accuracy: soloAccuracy,
      avgScore: soloAvgScore,
      totalScore: Math.round(soloRow.total_score * 100) / 100,
    },
    pvp: {
      gamesPlayed: pvpRow.played,
      wins: pvpRow.wins,
      losses: pvpLosses,
      draws: pvpRow.draws,
      rating: eloRow ? eloRow.rating : 1000,
    },
    blitz: {
      gamesPlayed: blitzRow.played,
      wins: blitzRow.wins,
      losses: blitzLosses,
      draws: blitzRow.draws,
      rating: blitzEloRow ? blitzEloRow.rating : 1000,
    },
    survival: {
      gamesPlayed: survRow.played,
      totalQuestions: survRow.total_questions,
      totalCorrect: survRow.total_correct,
      accuracy: survAccuracy,
      avgScore: survAvgScore,
      totalScore: Math.round(survRow.total_score * 100) / 100,
      bestScore: Math.round(bestSurv.best_survival_score * 100) / 100,
      bestStreak: bestSurv.best_survival_streak,
    },
    gamesByFormat: [
      { format: 'solo', count: soloRow.played, label: 'Соло' },
      { format: 'pvp', count: pvpRow.played, label: 'PvP' },
      { format: 'blitz', count: blitzRow.played, label: 'Блиц' },
      { format: 'survival', count: survRow.played, label: 'Выживание' },
    ],
    authoredByCategory: (() => {
      interface AuthTopicRow { category: string; topic: string; count: number }
      const rows = db.prepare(
        `SELECT c.name as category, t.name as topic, COUNT(*) as count
         FROM questions q JOIN topics t ON q.topic_id = t.id JOIN categories c ON t.category_id = c.id
         WHERE q.author_id = ? GROUP BY c.id, t.id ORDER BY c.sort_order, count DESC`,
      ).all(userId) as AuthTopicRow[]

      const map = new Map<string, { category: string; total: number; topics: { topic: string; count: number }[] }>()
      for (const r of rows) {
        if (!map.has(r.category)) map.set(r.category, { category: r.category, total: 0, topics: [] })
        const entry = map.get(r.category)!
        entry.total += r.count
        entry.topics.push({ topic: r.topic, count: r.count })
      }
      return Array.from(map.values()).sort((a, b) => b.total - a.total)
    })(),
    recent: recent.map((g) => ({
      id: g.id,
      format: g.format as RecentRow['format'],
      total: g.total,
      correct: g.correct,
      score: Math.round(g.score * 100) / 100,
      date: g.date,
    })),
  }
}
