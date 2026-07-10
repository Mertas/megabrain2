import type { Server as HttpServer } from 'http'
import { Server as SocketServer, type Socket } from 'socket.io'
import { verifyAccessToken } from '../../lib/jwt.js'
import { db } from '../../db/connection.js'
import { joinQueue, leaveQueue, isInQueue, findMatch, getPlayerGame } from './blitz.lobby.js'
import { createGame, startRound, processAnswer, getCurrentRound, isGameOver, calculateResults, clearGameTimers, getOpponentUserId } from './blitz.engine.js'
import type { BlitzGame } from './blitz.types.js'

const isDev = process.env.NODE_ENV !== 'production'

interface AuthSocket extends Socket {
  userId?: number
  login?: string
  nickname?: string
}

export function createBlitzServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: isDev
        ? ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:4173']
        : (process.env.CORS_ORIGIN || '').split(',').filter(Boolean),
      credentials: true,
    },
    path: '/blitz-socket',
  })

  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth?.token as string
    if (!token) { next(new Error('No token')); return }
    try {
      const payload = verifyAccessToken(token)
      if (payload.type !== 'access') { next(new Error('Invalid token type')); return }
      socket.userId = payload.userId
      const user = db.prepare('SELECT login, nickname FROM users WHERE id = ?').get(payload.userId) as { login: string; nickname: string } | undefined
      if (!user) { next(new Error('User not found')); return }
      socket.login = user.login
      socket.nickname = user.nickname
      next()
    } catch { next(new Error('Invalid token')) }
  })

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthSocket
    const uid = socket.userId!

    console.log(`[Blitz] ${socket.login} connected`)

    socket.on('blitz:join', (data: { topicIds: number[]; roundCount: number; timePerRound: number; powerupIds?: string[] }) => {
      if (isInQueue(uid) || getPlayerGame(uid)) {
        socket.emit('blitz:error', { message: 'Уже в очереди или в игре' })
        return
      }

      const elo = db.prepare('SELECT rating FROM blitz_ratings WHERE user_id = ?').get(uid) as { rating: number } | undefined
      if (!elo) db.prepare('INSERT OR IGNORE INTO blitz_ratings (user_id, rating) VALUES (?, 1000)').run(uid)

      joinQueue({
        userId: uid,
        login: socket.login!,
        nickname: socket.nickname!,
        rating: elo?.rating || 1000,
        topicIds: data.topicIds,
        roundCount: data.roundCount,
        timePerRound: data.timePerRound,
        powerupIds: data.powerupIds || [],
        joinedAt: Date.now(),
      })

      socket.emit('blitz:waiting')
      tryMatch(io)
    })

    socket.on('blitz:cancel', () => {
      leaveQueue(uid)
      socket.emit('blitz:cancelled')
    })

    socket.on('blitz:answer', (data: { answer: string; timeCs: number }) => {
      const game = getPlayerGame(uid)
      if (!game) { socket.emit('blitz:error', { message: 'Нет активной игры' }); return }

      const currentRound = getCurrentRound(game)
      if (!currentRound) { socket.emit('blitz:error', { message: 'Нет активного раунда' }); return }
      if (currentRound.winnerId !== null && currentRound.endedAt > 0) { return }

      const result = processAnswer(game, uid, data.answer, data.timeCs, currentRound.correctIndex, currentRound.answers)

      if (result.roundEnded) {
        clearGameTimers(game)
        endRound(io, game)
      } else {
        // Tell opponent this player answered
        const oppId = getOpponentUserId(game, uid)
        const oppSocket = findSocket(io, oppId)
        if (oppSocket) oppSocket.emit('blitz:opponent-answered')
      }
    })

    socket.on('disconnect', () => {
      console.log(`[Blitz] ${socket.login} disconnected`)
      leaveQueue(uid)

      const game = getPlayerGame(uid)
      if (game) {
        const dcTimeout = setTimeout(() => {
          const g = getPlayerGame(uid)
          if (g) {
            clearGameTimers(g)
            const results = calculateResults(g, uid)
            const p1Socket = findSocket(io, g.player1.userId)
            const p2Socket = findSocket(io, g.player2.userId)
            if (p1Socket) p1Socket.emit('blitz:game-result', results.p1Result)
            if (p2Socket) p2Socket.emit('blitz:game-result', results.p2Result)
          }
        }, 15000)

        if (game.player1.userId === uid) game.disconnect1 = dcTimeout
        else game.disconnect2 = dcTimeout

        const oppId = getOpponentUserId(game, uid)
        const oppSocket = findSocket(io, oppId)
        if (oppSocket) oppSocket.emit('blitz:opponent-disconnected')
      }
    })

    // Powerup
    socket.on('blitz:use-powerup', (data: { powerupId: string }) => {
      const game = getPlayerGame(uid)
      if (!game) return

      const oppId = getOpponentUserId(game, uid)
      const oppSocket = findSocket(io, oppId)

      if (data.powerupId === 'freeze' && oppSocket) {
        oppSocket.emit('blitz:powerup-opponent', { powerupId: 'freeze', effect: 'Соперник заморозил ваш таймер на 3 сек!' })
        socket.emit('blitz:powerup-self', { powerupId: 'freeze' })
      }
    })
  })

  return io
}

function tryMatch(io: SocketServer) {
  const match = findMatch()
  if (!match) return

  const commonTopicIds = [...new Set([
    ...match.p1.topicIds.filter((id) => match.p2.topicIds.includes(id)),
    ...match.p1.topicIds, ...match.p2.topicIds,
  ])]

  const game = createGame(
    { userId: match.p1.userId, login: match.p1.login, nickname: match.p1.nickname, rating: match.p1.rating },
    { userId: match.p2.userId, login: match.p2.login, nickname: match.p2.nickname, rating: match.p2.rating },
    commonTopicIds,
    match.p1.roundCount,
    match.p1.timePerRound,
  )

  const p1Socket = findSocket(io, match.p1.userId)
  const p2Socket = findSocket(io, match.p2.userId)

  const p1Data = {
    opponent: { id: match.p2.userId, login: match.p2.login, nickname: match.p2.nickname, rating: match.p2.rating },
    roundCount: match.p1.roundCount,
    timePerRound: match.p1.timePerRound,
  }
  const p2Data = {
    opponent: { id: match.p1.userId, login: match.p1.login, nickname: match.p1.nickname, rating: match.p1.rating },
    roundCount: match.p2.roundCount,
    timePerRound: match.p2.timePerRound,
  }

  if (p1Socket) p1Socket.emit('blitz:match-found', p1Data)
  if (p2Socket) p2Socket.emit('blitz:match-found', p2Data)

  let count = 3
  if (p1Socket) p1Socket.emit('blitz:countdown', { seconds: count })
  if (p2Socket) p2Socket.emit('blitz:countdown', { seconds: count })

  const interval = setInterval(() => {
    count--
    if (count <= 0) {
      clearInterval(interval)
      startNextRound(io, game)
      return
    }
    if (p1Socket) p1Socket.emit('blitz:countdown', { seconds: count })
    if (p2Socket) p2Socket.emit('blitz:countdown', { seconds: count })
  }, 1000)
  game.countdownInterval = interval
}

function startNextRound(io: SocketServer, game: BlitzGame) {
  if (isGameOver(game)) {
    finishGame(io, game)
    return
  }

  // Fetch random question from topic pool
  const placeholders = game.topicIds.map(() => '?').join(',')
  const row = db.prepare(
    `SELECT id, text, answer_1, answer_2, answer_3, answer_4, correct_index, note
     FROM questions
     WHERE topic_id IN (${placeholders})
     ORDER BY RANDOM()
     LIMIT 1`,
  ).all(...game.topicIds) as Array<{
    id: number; text: string; answer_1: string; answer_2: string; answer_3: string; answer_4: string; correct_index: number; note: string | null
  }>

  if (!row.length) {
    // Fallback — no questions
    finishGame(io, game)
    return
  }

  const q = row[0]
  const answers = [q.answer_1, q.answer_2, q.answer_3, q.answer_4]
  const correctAnswer = answers[q.correct_index]
  const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5)
  const shuffled = indices.map((j) => answers[j])
  const newCorrectIndex = shuffled.indexOf(correctAnswer)

  startRound(game, { id: q.id, text: q.text, answers: shuffled, correctIndex: newCorrectIndex })

  const roundData = {
    roundNumber: game.currentRound,
    question: { text: q.text, answers: shuffled, note: q.note },
    scores: { p1: game.player1.roundsWon, p2: game.player2.roundsWon },
  }

  const p1Socket = findSocket(io, game.player1.userId)
  const p2Socket = findSocket(io, game.player2.userId)
  if (p1Socket) p1Socket.emit('blitz:round-start', roundData)
  if (p2Socket) p2Socket.emit('blitz:round-start', roundData)

  // Round timer
  if (game.timePerRound > 0) {
    game.timer = setTimeout(() => {
      endRound(io, game)
    }, game.timePerRound * 1000)
  }
}

function endRound(io: SocketServer, game: BlitzGame) {
  if (game.timer) { clearTimeout(game.timer); game.timer = null }

  const round = getCurrentRound(game)
  if (!round) return

  const p1Socket = findSocket(io, game.player1.userId)
  const p2Socket = findSocket(io, game.player2.userId)

  const resultData = {
    roundNumber: round.roundNumber,
    winnerId: round.winnerId,
    p1: { answer: round.p1Answer, correct: round.p1Correct, timeCs: round.p1TimeCs },
    p2: { answer: round.p2Answer, correct: round.p2Correct, timeCs: round.p2TimeCs },
    correctAnswer: round.answers[round.correctIndex],
    scores: { p1: game.player1.roundsWon, p2: game.player2.roundsWon },
  }

  if (p1Socket) p1Socket.emit('blitz:round-result', resultData)
  if (p2Socket) p2Socket.emit('blitz:round-result', resultData)

  setTimeout(() => {
    if (isGameOver(game)) {
      finishGame(io, game)
    } else {
      startNextRound(io, game)
    }
  }, 2000)
}

function finishGame(io: SocketServer, game: BlitzGame) {
  clearGameTimers(game)
  const results = calculateResults(game)

  const p1Socket = findSocket(io, game.player1.userId)
  const p2Socket = findSocket(io, game.player2.userId)
  if (p1Socket) p1Socket.emit('blitz:game-result', results.p1Result)
  if (p2Socket) p2Socket.emit('blitz:game-result', results.p2Result)
}

function findSocket(io: SocketServer, userId: number): AuthSocket | undefined {
  for (const [, socket] of io.sockets.sockets) {
    if ((socket as AuthSocket).userId === userId) return socket as AuthSocket
  }
  return undefined
}
