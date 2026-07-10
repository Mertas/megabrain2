import { db } from '../../db/connection.js'
import { calcElo } from './pvp.elo.js'
import { addGame, getGame, removeGame } from './pvp.lobby.js'
import type { PvPGame, PvPQuestion, PvPResult } from './pvp.types.js'

let nextGameId = 1

export function createGame(p1: { userId: number; login: string; nickname: string; rating: number }, p2: { userId: number; login: string; nickname: string; rating: number }, questions: PvPQuestion[], topicIds: number[], questionCount: number, timePerQuestion: number): PvPGame {
  const game: PvPGame = {
    id: nextGameId++,
    player1: { ...p1, topicIds, questionCount, timePerQuestion, strictTopics: false, joinedAt: 0, powerupIds: [] },
    player2: { ...p2, topicIds, questionCount, timePerQuestion, strictTopics: false, joinedAt: 0, powerupIds: [] },
    questions,
    questionCount,
    timePerQuestion,
    startedAt: Date.now(),
    answers: new Map(),
    questionStartTs: Date.now(),
    currentQuestionIndex: 0,
    timer: null,
    disconnect1: null,
    disconnect2: null,
    countdownInterval: null,
    powerups: new Map(),
  }
  game.powerups.set(p1.userId, { shield: false, doublePoints: false, freezeApplied: false, extraTime: 0 })
  game.powerups.set(p2.userId, { shield: false, doublePoints: false, freezeApplied: false, extraTime: 0 })
  addGame(game)
  return game
}

export function getOpponentUserId(game: PvPGame, userId: number): number {
  return game.player1.userId === userId ? game.player2.userId : game.player1.userId
}

export function getPlayerEntry(game: PvPGame, userId: number) {
  return game.player1.userId === userId ? game.player1 : game.player2
}

export function recordAnswer(game: PvPGame, userId: number, questionIndex: number, answer: string, timeElapsedCs: number): { correct: boolean; points: number; correctAnswer: string } | null {
  const q = game.questions[questionIndex]
  if (!q) return null

  const selectedIndex = q.answers.indexOf(answer)
  const correct = selectedIndex === q.correctIndex

  const timeLimitCs = game.timePerQuestion * 100
  let points = 0
  if (correct) {
    if (timeLimitCs > 0) {
      points = 10 * Math.pow(0.1, timeElapsedCs / timeLimitCs)
    } else {
      points = 1
    }
  }
  points = Math.round(points * 100) / 100

  const entry = game.answers.get(questionIndex) || []
  entry.push({ userId, questionIndex, answer, timeElapsedCs, correct, points })
  game.answers.set(questionIndex, entry)

  return { correct, points, correctAnswer: q.answers[q.correctIndex] }
}

export function isQuestionCompleted(game: PvPGame, questionIndex: number): boolean {
  const answers = game.answers.get(questionIndex) || []
  return answers.length >= 2 || answers.some((a) => a.userId === game.player1.userId) && answers.some((a) => a.userId === game.player2.userId)
}

export function calculateResults(game: PvPGame, disconnectedUserId?: number): { p1Result: PvPResult; p2Result: PvPResult } {
  const breakdown = game.questions.map((q, i) => {
    const ans = game.answers.get(i) || []
    const a1 = ans.find((a) => a.userId === game.player1.userId)
    const a2 = ans.find((a) => a.userId === game.player2.userId)
    return {
      questionId: q.id,
      correctAnswer: q.answers[q.correctIndex],
      p1Answer: a1?.answer || null,
      p2Answer: a2?.answer || null,
      p1Correct: a1?.correct || false,
      p2Correct: a2?.correct || false,
      p1Points: a1?.points || 0,
      p2Points: a2?.points || 0,
    }
  })

  const scoreP1 = Math.round(breakdown.reduce((s, b) => s + b.p1Points, 0) * 100) / 100
  const scoreP2 = Math.round(breakdown.reduce((s, b) => s + b.p2Points, 0) * 100) / 100

  // Determine winner
  let winnerId: number | null = null
  let scoreA = 0.5
  if (disconnectedUserId) {
    winnerId = disconnectedUserId === game.player1.userId ? game.player2.userId : game.player1.userId
    scoreA = winnerId === game.player1.userId ? 1 : 0
  } else if (scoreP1 > scoreP2) {
    winnerId = game.player1.userId
    scoreA = 1
  } else if (scoreP2 > scoreP1) {
    winnerId = game.player2.userId
    scoreA = 0
  }

  // ELO
  const eloP1 = db.prepare('SELECT rating FROM elo_ratings WHERE user_id = ?').get(game.player1.userId) as { rating: number } | undefined
  const eloP2 = db.prepare('SELECT rating FROM elo_ratings WHERE user_id = ?').get(game.player2.userId) as { rating: number } | undefined
  const r1 = eloP1?.rating || 1000
  const r2 = eloP2?.rating || 1000

  // Ensure both have ratings
  if (!eloP1) db.prepare('INSERT OR IGNORE INTO elo_ratings (user_id, rating) VALUES (?, 1000)').run(game.player1.userId)
  if (!eloP2) db.prepare('INSERT OR IGNORE INTO elo_ratings (user_id, rating) VALUES (?, 1000)').run(game.player2.userId)

  const elo = calcElo(r1, r2, scoreA)

  // Update ratings
  db.prepare('UPDATE elo_ratings SET rating = ?, wins = wins + ?, losses = losses + ?, draws = draws + ? WHERE user_id = ?').run(
    elo.newA, scoreA === 1 ? 1 : 0, scoreA === 0 ? 1 : 0, scoreA === 0.5 ? 1 : 0, game.player1.userId,
  )
  db.prepare('UPDATE elo_ratings SET rating = ?, wins = wins + ?, losses = losses + ?, draws = draws + ? WHERE user_id = ?').run(
    elo.newB, scoreA === 0 ? 1 : 0, scoreA === 1 ? 1 : 0, scoreA === 0.5 ? 1 : 0, game.player2.userId,
  )

  // Save game to DB
  const result = db.prepare(
    'INSERT INTO pvp_games (player1_id, player2_id, winner_id, topic_ids, question_count, time_per_q, score_p1, score_p2, elo_change_p1, elo_change_p2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(game.player1.userId, game.player2.userId, winnerId, JSON.stringify(game.player1.topicIds), game.questionCount, game.timePerQuestion, scoreP1, scoreP2, elo.changeA, elo.changeB)

  const gameId = result.lastInsertRowid as number

  // Save answers
  for (const b of breakdown) {
    const a1 = game.answers.get(game.questions.findIndex((q) => q.id === b.questionId))?.find((a) => a.userId === game.player1.userId)
    const a2 = game.answers.get(game.questions.findIndex((q) => q.id === b.questionId))?.find((a) => a.userId === game.player2.userId)
    db.prepare('INSERT INTO pvp_game_answers (game_id, user_id, question_id, correct, time_elapsed_cs, points) VALUES (?, ?, ?, ?, ?, ?)').run(
      gameId, game.player1.userId, b.questionId, b.p1Correct ? 1 : 0, a1?.timeElapsedCs || 0, b.p1Points,
    )
    db.prepare('INSERT INTO pvp_game_answers (game_id, user_id, question_id, correct, time_elapsed_cs, points) VALUES (?, ?, ?, ?, ?, ?)').run(
      gameId, game.player2.userId, b.questionId, b.p2Correct ? 1 : 0, a2?.timeElapsedCs || 0, b.p2Points,
    )
  }

  // Build result objects
  const makeResult = (userId: number, opponentId: number, score: number, oppScore: number, eloChange: number, eloNew: number): PvPResult => {
    const opp = userId === game.player1.userId ? game.player2 : game.player1
    const oppElo = userId === game.player1.userId ? elo.newB : elo.newA
    return {
      yourScore: score,
      opponentScore: oppScore,
      yourEloChange: eloChange,
      yourNewRating: eloNew,
      opponent: { id: opponentId, login: opp.login, nickname: opp.nickname, newRating: oppElo },
      breakdown: breakdown.map((b) => ({
        yourAnswer: userId === game.player1.userId ? b.p1Answer : b.p2Answer,
        opponentAnswer: userId === game.player1.userId ? b.p2Answer : b.p1Answer,
        correctAnswer: b.correctAnswer,
        correct: userId === game.player1.userId ? b.p1Correct : b.p2Correct,
        opponentCorrect: userId === game.player1.userId ? b.p2Correct : b.p1Correct,
        yourPoints: userId === game.player1.userId ? b.p1Points : b.p2Points,
      })),
    }
  }

  const p1Result = makeResult(game.player1.userId, game.player2.userId, scoreP1, scoreP2, elo.changeA, elo.newA)
  const p2Result = makeResult(game.player2.userId, game.player1.userId, scoreP2, scoreP1, elo.changeB, elo.newB)

  removeGame(game.id)
  return { p1Result, p2Result }
}

export function startQuestionTimer(game: PvPGame, onTimeout: (game: PvPGame) => void): void {
  if (game.timer) clearTimeout(game.timer)
  game.questionStartTs = Date.now()
  if (game.timePerQuestion > 0) {
    game.timer = setTimeout(() => onTimeout(game), game.timePerQuestion * 1000 + 500) // 500ms grace
  }
}

export function clearGameTimer(game: PvPGame): void {
  if (game.timer) clearTimeout(game.timer)
  if (game.disconnect1) clearTimeout(game.disconnect1)
  if (game.disconnect2) clearTimeout(game.disconnect2)
  if (game.countdownInterval) clearInterval(game.countdownInterval)
}
