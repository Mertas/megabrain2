import { Router } from 'express'
import { db } from '../../db/connection.js'

export const pvpRouter = Router()

// History for a user
pvpRouter.get('/history/:login', (req, res) => {
  const login = req.params.login as string
  const user = db.prepare('SELECT id FROM users WHERE login = ?').get(login) as { id: number } | undefined
  if (!user) { res.status(404).json({ error: 'NOT_FOUND', message: 'Пользователь не найден' }); return }

  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const offset = (page - 1) * limit

  const countRow = db.prepare('SELECT COUNT(*) as c FROM pvp_games WHERE player1_id = ? OR player2_id = ?').get(user.id, user.id) as { c: number }
  const rows = db.prepare(
    `SELECT g.*,
            u1.login as p1_login, u1.nickname as p1_nickname,
            u2.login as p2_login, u2.nickname as p2_nickname
     FROM pvp_games g
     JOIN users u1 ON u1.id = g.player1_id
     JOIN users u2 ON u2.id = g.player2_id
     WHERE g.player1_id = ? OR g.player2_id = ?
     ORDER BY g.created_at DESC
     LIMIT ? OFFSET ?`,
  ).all(user.id, user.id, limit, offset) as Array<{
    id: number; player1_id: number; player2_id: number; winner_id: number | null
    score_p1: number; score_p2: number; elo_change_p1: number; elo_change_p2: number
    question_count: number; topic_ids: string; time_per_q: number; created_at: string
    p1_login: string; p1_nickname: string; p2_login: string; p2_nickname: string
  }>

  res.json({
    items: rows.map((r) => {
      const isP1 = r.player1_id === user.id
      return {
        id: r.id,
        opponent: isP1 ? { login: r.p2_login, nickname: r.p2_nickname } : { login: r.p1_login, nickname: r.p1_nickname },
        won: r.winner_id === user.id,
        draw: r.winner_id === null,
        yourScore: isP1 ? r.score_p1 : r.score_p2,
        opponentScore: isP1 ? r.score_p2 : r.score_p1,
        eloChange: isP1 ? r.elo_change_p1 : r.elo_change_p2,
        questionCount: r.question_count,
        date: r.created_at,
      }
    }),
    total: countRow.c,
    page,
    pages: Math.ceil(countRow.c / limit),
  })
})

// Ratings / leaderboard
pvpRouter.get('/ratings', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  const offset = (page - 1) * limit

  const countRow = db.prepare('SELECT COUNT(*) as c FROM elo_ratings WHERE wins + losses + draws > 0').get() as { c: number }
  const rows = db.prepare(
    `SELECT e.*, u.login, u.nickname, u.icon
     FROM elo_ratings e
     JOIN users u ON u.id = e.user_id
     WHERE e.wins + e.losses + e.draws > 0
     ORDER BY e.rating DESC
     LIMIT ? OFFSET ?`,
  ).all(limit, offset) as Array<{
    user_id: number; rating: number; wins: number; losses: number; draws: number
    login: string; nickname: string; icon: string
  }>

  res.json({
    items: rows.map((r, i) => ({
      rank: offset + i + 1,
      userId: r.user_id,
      login: r.login,
      nickname: r.nickname,
      icon: r.icon,
      rating: r.rating,
      wins: r.wins,
      losses: r.losses,
      draws: r.draws,
    })),
    total: countRow.c,
    page,
    pages: Math.ceil(countRow.c / limit),
  })
})
