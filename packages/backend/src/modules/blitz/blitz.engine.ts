import { db } from '../../db/connection.js'
import { calcElo } from './blitz.elo.js'
import { addGame, removeGame } from './blitz.lobby.js'
import type { BlitzGame, BlitzRoundResult } from './blitz.types.js'

let nextGameId = 1

export function createGame(
  p1: { userId: number; login: string; nickname: string; rating: number },
  p2: { userId: number; login: string; nickname: string; rating: number },
  topicIds: number[],
  roundCount: number,
  timePerRound: number,
): BlitzGame {
  const game: BlitzGame = {
    id: nextGameId++,
    player1: { userId: p1.userId, login: p1.login, nickname: p1.nickname, rating: p1.rating, roundsWon: 0, lockedOut: false, answeredThisRound: false },
    player2: { userId: p2.userId, login: p2.login, nickname: p2.nickname, rating: p2.rating, roundsWon: 0, lockedOut: false, answeredThisRound: false },
    topicIds,
    roundCount,
    timePerRound,
    currentRound: 0,
    rounds: [],
    startedAt: Date.now(),
    timer: null,
    disconnect1: null,
    disconnect2: null,
    countdownInterval: null,
    powerups: new Map(),
  }
  game.powerups.set(p1.userId, { shield: false, freezeApplied: false, extraTime: 0 })
  game.powerups.set(p2.userId, { shield: false, freezeApplied: false, extraTime: 0 })
  addGame(game)
  return game
}

export function getOpponentUserId(game: BlitzGame, userId: number): number {
  return game.player1.userId === userId ? game.player2.userId : game.player1.userId
}

export function getPlayerState(game: BlitzGame, userId: number) {
  return game.player1.userId === userId ? game.player1 : game.player2
}

export function processAnswer(
  game: BlitzGame,
  userId: number,
  answer: string,
  timeCs: number,
  correctIndex: number,
  answers: string[],
): { correct: boolean; roundEnded: boolean; winnerId: number | null } {
  const player = getPlayerState(game, userId)
  const opponent = game.player1.userId === userId ? game.player2 : game.player1

  if (player.answeredThisRound || player.lockedOut) {
    return { correct: false, roundEnded: false, winnerId: null }
  }

  const selectedIndex = answers.indexOf(answer)
  const correct = selectedIndex === correctIndex

  player.answeredThisRound = true

  const round = game.rounds[game.currentRound]
  if (!round) return { correct: false, roundEnded: false, winnerId: null }

  if (userId === game.player1.userId) {
    round.p1Answer = answer
    round.p1Correct = correct
    round.p1TimeCs = timeCs
  } else {
    round.p2Answer = answer
    round.p2Correct = correct
    round.p2TimeCs = timeCs
  }

  if (correct) {
    round.winnerId = userId
    round.endedAt = Date.now()
    if (userId === game.player1.userId) game.player1.roundsWon++
    else game.player2.roundsWon++
    return { correct: true, roundEnded: true, winnerId: userId }
  }

  player.lockedOut = true

  // Check if both locked out → draw
  if (game.player1.lockedOut && game.player2.lockedOut) {
    round.winnerId = null
    round.endedAt = Date.now()
    return { correct: false, roundEnded: true, winnerId: null }
  }

  return { correct: false, roundEnded: false, winnerId: null }
}

export function startRound(game: BlitzGame, question: { id: number; text: string; answers: string[]; correctIndex: number }): void {
  const round: BlitzRoundResult = {
    roundNumber: game.currentRound + 1,
    questionId: question.id,
    questionText: question.text,
    answers: question.answers,
    correctIndex: question.correctIndex,
    winnerId: null,
    p1Answer: null,
    p1Correct: null,
    p1TimeCs: null,
    p2Answer: null,
    p2Correct: null,
    p2TimeCs: null,
    endedAt: 0,
  }
  game.currentRound++
  game.rounds.push(round)
  game.player1.lockedOut = false
  game.player1.answeredThisRound = false
  game.player2.lockedOut = false
  game.player2.answeredThisRound = false
}

export function getCurrentRound(game: BlitzGame): BlitzRoundResult | undefined {
  return game.rounds[game.currentRound - 1]
}

export function isGameOver(game: BlitzGame): boolean {
  const needed = Math.floor(game.roundCount / 2) + 1
  return game.player1.roundsWon >= needed || game.player2.roundsWon >= needed
}

interface BlitzResults {
  p1Result: BlitzSingleResult
  p2Result: BlitzSingleResult
}

interface BlitzSingleResult {
  winnerId: number | null
  yourScore: number
  opponentScore: number
  yourEloChange: number
  yourNewRating: number
  opponent: { id: number; login: string; nickname: string; newRating: number }
  rounds: {
    roundNumber: number
    questionText: string
    answers: string[]
    correctAnswer: string
    yourAnswer: string | null
    opponentAnswer: string | null
    yourCorrect: boolean | null
    opponentCorrect: boolean | null
    winnerId: number | null
  }[]
}

export function calculateResults(game: BlitzGame, disconnectedUserId?: number): BlitzResults {
  // Determine winner
  let winnerId: number | null = null
  if (disconnectedUserId) {
    winnerId = disconnectedUserId === game.player1.userId ? game.player2.userId : game.player1.userId
  } else {
    const needed = Math.floor(game.roundCount / 2) + 1
    if (game.player1.roundsWon >= needed) winnerId = game.player1.userId
    else if (game.player2.roundsWon >= needed) winnerId = game.player2.userId
  }

  const scoreA = winnerId === null ? 0.5 : winnerId === game.player1.userId ? 1 : 0

  let eloP1 = db.prepare('SELECT rating FROM blitz_ratings WHERE user_id = ?').get(game.player1.userId) as { rating: number } | undefined
  let eloP2 = db.prepare('SELECT rating FROM blitz_ratings WHERE user_id = ?').get(game.player2.userId) as { rating: number } | undefined

  if (!eloP1) { db.prepare('INSERT OR IGNORE INTO blitz_ratings (user_id, rating) VALUES (?, 1000)').run(game.player1.userId); eloP1 = { rating: 1000 } }
  if (!eloP2) { db.prepare('INSERT OR IGNORE INTO blitz_ratings (user_id, rating) VALUES (?, 1000)').run(game.player2.userId); eloP2 = { rating: 1000 } }

  const elo = calcElo(eloP1.rating, eloP2.rating, scoreA)

  db.prepare('UPDATE blitz_ratings SET rating = ?, wins = wins + ?, losses = losses + ?, draws = draws + ? WHERE user_id = ?').run(
    elo.newA, scoreA === 1 ? 1 : 0, scoreA === 0 ? 1 : 0, scoreA === 0.5 ? 1 : 0, game.player1.userId,
  )
  db.prepare('UPDATE blitz_ratings SET rating = ?, wins = wins + ?, losses = losses + ?, draws = draws + ? WHERE user_id = ?').run(
    elo.newB, scoreA === 0 ? 1 : 0, scoreA === 1 ? 1 : 0, scoreA === 0.5 ? 1 : 0, game.player2.userId,
  )

  const result = db.prepare(
    'INSERT INTO blitz_games (player1_id, player2_id, winner_id, topic_ids, round_count, time_per_round, score_p1, score_p2, elo_change_p1, elo_change_p2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    game.player1.userId, game.player2.userId, winnerId, JSON.stringify(game.topicIds),
    game.roundCount, game.timePerRound,
    game.player1.roundsWon, game.player2.roundsWon,
    elo.changeA, elo.changeB,
  )
  const gameId = result.lastInsertRowid as number

  for (const round of game.rounds) {
    db.prepare(
      'INSERT INTO blitz_game_rounds (game_id, round_number, question_id, winner_id, p1_answer, p1_correct, p1_time_cs, p2_answer, p2_correct, p2_time_cs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(
      gameId, round.roundNumber, round.questionId, round.winnerId,
      round.p1Answer, round.p1Correct == null ? null : (round.p1Correct ? 1 : 0), round.p1TimeCs,
      round.p2Answer, round.p2Correct == null ? null : (round.p2Correct ? 1 : 0), round.p2TimeCs,
    )
  }

  const roundsSummary = game.rounds.map((r) => ({
    roundNumber: r.roundNumber,
    questionText: r.questionText,
    answers: r.answers,
    correctAnswer: r.answers[r.correctIndex],
    yourAnswer: null as string | null,
    opponentAnswer: null as string | null,
    yourCorrect: null as boolean | null,
    opponentCorrect: null as boolean | null,
    winnerId: r.winnerId,
  }))

  const p1Rounds = roundsSummary.map((r) => ({
    ...r,
    yourAnswer: r.winnerId === game.player1.userId ? (game.rounds.find((x) => x.roundNumber === r.roundNumber)?.p1Answer || null) : r.yourAnswer,
    opponentAnswer: r.winnerId === game.player1.userId ? (game.rounds.find((x) => x.roundNumber === r.roundNumber)?.p2Answer || null) : r.opponentAnswer,
  }))

  // Build full results
  const p1RoundsFull = game.rounds.map((r) => ({
    roundNumber: r.roundNumber,
    questionText: r.questionText,
    answers: r.answers,
    correctAnswer: r.answers[r.correctIndex],
    yourAnswer: r.p1Answer,
    opponentAnswer: r.p2Answer,
    yourCorrect: r.p1Correct,
    opponentCorrect: r.p2Correct,
    winnerId: r.winnerId,
  }))

  const p2RoundsFull = game.rounds.map((r) => ({
    roundNumber: r.roundNumber,
    questionText: r.questionText,
    answers: r.answers,
    correctAnswer: r.answers[r.correctIndex],
    yourAnswer: r.p2Answer,
    opponentAnswer: r.p1Answer,
    yourCorrect: r.p2Correct,
    opponentCorrect: r.p1Correct,
    winnerId: r.winnerId,
  }))

  const p1Result: BlitzSingleResult = {
    winnerId,
    yourScore: game.player1.roundsWon,
    opponentScore: game.player2.roundsWon,
    yourEloChange: elo.changeA,
    yourNewRating: elo.newA,
    opponent: { id: game.player2.userId, login: game.player2.login, nickname: game.player2.nickname, newRating: elo.newB },
    rounds: p1RoundsFull,
  }

  const p2Result: BlitzSingleResult = {
    winnerId,
    yourScore: game.player2.roundsWon,
    opponentScore: game.player1.roundsWon,
    yourEloChange: elo.changeB,
    yourNewRating: elo.newB,
    opponent: { id: game.player1.userId, login: game.player1.login, nickname: game.player1.nickname, newRating: elo.newA },
    rounds: p2RoundsFull,
  }

  removeGame(game.id)
  return { p1Result, p2Result }
}

export function clearGameTimers(game: BlitzGame): void {
  if (game.timer) clearTimeout(game.timer)
  if (game.disconnect1) clearTimeout(game.disconnect1)
  if (game.disconnect2) clearTimeout(game.disconnect2)
  if (game.countdownInterval) clearInterval(game.countdownInterval)
}
