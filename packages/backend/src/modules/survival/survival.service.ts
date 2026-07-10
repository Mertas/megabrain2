import { db } from '../../db/connection.js'

export const SURVIVAL_CONFIG = {
  initialLives: 3,
  initialTimeSeconds: 30,
  minTimeSeconds: 5,
  timeDecreasePerCorrect: 0.5,
  streakMultiplierStep: 5,
  streakMultiplierMax: 3.0,
  easyThreshold: 10,
  mediumThreshold: 25,
  extraLifeEvery: 50,
  maxLives: 5,
}

export function getDifficulty(streak: number): 'easy' | 'medium' | 'hard' {
  if (streak < SURVIVAL_CONFIG.easyThreshold) return 'easy'
  if (streak < SURVIVAL_CONFIG.mediumThreshold) return 'medium'
  return 'hard'
}

export function getTimeLimit(streak: number): number {
  const decrease = streak * SURVIVAL_CONFIG.timeDecreasePerCorrect
  return Math.max(SURVIVAL_CONFIG.minTimeSeconds, SURVIVAL_CONFIG.initialTimeSeconds - decrease)
}

export function getStreakMultiplier(streak: number): number {
  const steps = Math.floor(streak / SURVIVAL_CONFIG.streakMultiplierStep)
  return Math.min(SURVIVAL_CONFIG.streakMultiplierMax, 1 + steps * 0.25)
}

export function calcSurvivalPoints(timeElapsedCs: number, timeLimitSeconds: number, correct: boolean, streak: number): number {
  if (!correct) return 0
  const L = timeLimitSeconds * 100
  if (L <= 0) return 1
  const base = 10 * Math.pow(0.1, timeElapsedCs / L)
  const multiplier = getStreakMultiplier(streak)
  return Math.round(base * multiplier * 100) / 100
}

function getCategoryIdsByTopics(topicIds: number[]): number[] {
  const placeholders = topicIds.map(() => '?').join(',')
  const rows = db.prepare(
    `SELECT DISTINCT category_id FROM topics WHERE id IN (${placeholders})`,
  ).all(...topicIds) as { category_id: number }[]
  return rows.map((r) => r.category_id)
}

function getAllTopicIds(): number[] {
  const rows = db.prepare('SELECT id FROM topics').all() as { id: number }[]
  return rows.map((r) => r.id)
}

export function fetchSurvivalQuestion(
  topicIds: number[],
  difficulty: 'easy' | 'medium' | 'hard',
  excludeIds: number[],
): { id: number; text: string; image_url: string | null; answers: string[]; correctIndex: number; explanation: string | null; note: string | null } | null {
  let poolTopicIds: number[]

  switch (difficulty) {
    case 'easy':
      poolTopicIds = topicIds
      break
    case 'medium': {
      const catIds = getCategoryIdsByTopics(topicIds)
      if (catIds.length === 0) { poolTopicIds = getAllTopicIds(); break }
      const catPlaceholders = catIds.map(() => '?').join(',')
      const moreRows = db.prepare(
        `SELECT id FROM topics WHERE category_id IN (${catPlaceholders})`,
      ).all(...catIds) as { id: number }[]
      poolTopicIds = [...new Set([...topicIds, ...moreRows.map((r) => r.id)])]
      break
    }
    case 'hard':
      poolTopicIds = getAllTopicIds()
      break
    default:
      poolTopicIds = topicIds
  }

  if (poolTopicIds.length === 0) return null

  let sql: string
  let params: unknown[]

  if (excludeIds.length > 0) {
    const topicPlaceholders = poolTopicIds.map(() => '?').join(',')
    const excludePlaceholders = excludeIds.map(() => '?').join(',')
    sql = `
      SELECT id, text, image_url, answer_1, answer_2, answer_3, answer_4, correct_index, explanation, note
      FROM questions
      WHERE topic_id IN (${topicPlaceholders}) AND id NOT IN (${excludePlaceholders})
      ORDER BY RANDOM()
      LIMIT 1
    `
    params = [...poolTopicIds, ...excludeIds]
  } else {
    const topicPlaceholders = poolTopicIds.map(() => '?').join(',')
    sql = `
      SELECT id, text, image_url, answer_1, answer_2, answer_3, answer_4, correct_index, explanation, note
      FROM questions
      WHERE topic_id IN (${topicPlaceholders})
      ORDER BY RANDOM()
      LIMIT 1
    `
    params = poolTopicIds
  }

  const row = db.prepare(sql).get(...params) as {
    id: number; text: string; image_url: string | null
    answer_1: string; answer_2: string; answer_3: string; answer_4: string
    correct_index: number; explanation: string | null; note: string | null
  } | undefined

  if (!row) {
    if (excludeIds.length > 0) {
      return fetchSurvivalQuestion(topicIds, difficulty, [])
    }
    return null
  }

  const answers = [row.answer_1, row.answer_2, row.answer_3, row.answer_4]
  const correctAnswer = answers[row.correct_index]
  const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5)
  const shuffled = indices.map((i) => answers[i])
  const newCorrectIndex = shuffled.indexOf(correctAnswer)

  return {
    id: row.id,
    text: row.text,
    image_url: row.image_url,
    answers: shuffled,
    correctIndex: newCorrectIndex,
    explanation: row.explanation,
    note: (row as any).note || null,
  }
}

export function saveSurvivalGame(data: {
  userId: number
  topicIds: number[]
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  maxStreak: number
  finalStreak: number
  livesLeft: number
  totalScore: number
  totalTimeCs: number
  difficultyReached: number
  questions: {
    questionId: number
    questionIndex: number
    correct: boolean
    timeElapsedCs: number
    points: number
    streakAtMoment: number
    difficultyLevel: number
  }[]
}): { gameId: number; isNewBestScore: boolean; isNewBestStreak: boolean } {
  const result = db.prepare(
    `INSERT INTO survival_games (user_id, topic_ids, total_questions, correct_answers, wrong_answers, max_streak, final_streak, lives_left, total_score, total_time_cs, difficulty_reached)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    data.userId, JSON.stringify(data.topicIds),
    data.totalQuestions, data.correctAnswers, data.wrongAnswers,
    data.maxStreak, data.finalStreak, data.livesLeft,
    data.totalScore, data.totalTimeCs, data.difficultyReached,
  )
  const gameId = result.lastInsertRowid as number

  const insertQ = db.prepare(
    `INSERT INTO survival_game_questions (game_id, question_id, question_index, correct, time_elapsed_cs, points, streak_at_moment, difficulty_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  for (const q of data.questions) {
    insertQ.run(gameId, q.questionId, q.questionIndex, q.correct ? 1 : 0, q.timeElapsedCs, q.points, q.streakAtMoment, q.difficultyLevel)
  }

  let isNewBestScore = false
  let isNewBestStreak = false

  const user = db.prepare('SELECT best_survival_score, best_survival_streak FROM users WHERE id = ?').get(data.userId) as { best_survival_score: number; best_survival_streak: number } | undefined
  if (user) {
    if (data.totalScore > user.best_survival_score) {
      db.prepare('UPDATE users SET best_survival_score = ? WHERE id = ?').run(data.totalScore, data.userId)
      isNewBestScore = true
    }
    if (data.maxStreak > user.best_survival_streak) {
      db.prepare('UPDATE users SET best_survival_streak = ? WHERE id = ?').run(data.maxStreak, data.userId)
      isNewBestStreak = true
    }
  }

  return { gameId, isNewBestScore, isNewBestStreak }
}

export function getSurvivalLeaderboard(period: 'all' | 'weekly' | 'daily', limit: number): Array<{
  rank: number
  userId: number
  nickname: string
  score: number
  maxStreak: number
  totalQuestions: number
  date: string
}> {
  let timeFilter = ''
  if (period === 'daily') timeFilter = "AND g.created_at >= datetime('now', '-1 day')"
  else if (period === 'weekly') timeFilter = "AND g.created_at >= datetime('now', '-7 days')"

  const rows = db.prepare(
    `SELECT g.user_id, u.nickname, g.total_score, g.max_streak, g.total_questions, g.created_at
     FROM survival_games g
     JOIN users u ON u.id = g.user_id
     WHERE g.total_questions > 0 ${timeFilter}
     ORDER BY g.total_score DESC
     LIMIT ?`,
  ).all(limit) as Array<{
    user_id: number; nickname: string; total_score: number; max_streak: number; total_questions: number; created_at: string
  }>

  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.user_id,
    nickname: r.nickname,
    score: r.total_score,
    maxStreak: r.max_streak,
    totalQuestions: r.total_questions,
    date: r.created_at,
  }))
}

export function getSurvivalUserRank(userId: number): { rank: number; score: number } | null {
  const row = db.prepare(
    `SELECT total_score FROM survival_games WHERE user_id = ? ORDER BY total_score DESC LIMIT 1`,
  ).get(userId) as { total_score: number } | undefined

  if (!row) return null

  const countRow = db.prepare(
    `SELECT COUNT(*) as c FROM survival_games WHERE total_score > ? AND total_questions > 0`,
  ).get(row.total_score) as { c: number }

  return { rank: countRow.c + 1, score: row.total_score }
}
