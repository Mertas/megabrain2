import type { Server as HttpServer } from 'http'
import { Server as SocketServer, type Socket } from 'socket.io'
import { verifyAccessToken } from '../../lib/jwt.js'
import { db } from '../../db/connection.js'
import { joinQueue, leaveQueue, isInQueue, findMatch, getPlayerGame } from './pvp.lobby.js'
import { createGame, getOpponentUserId, recordAnswer, calculateResults, startQuestionTimer, clearGameTimer } from './pvp.engine.js'
import type { PvPGame, PvPQuestion } from './pvp.types.js'

const isDev = process.env.NODE_ENV !== 'production'

interface AuthSocket extends Socket {
  userId?: number
  login?: string
  nickname?: string
}

export function createPvPServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: isDev
        ? ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:4173']
        : (process.env.CORS_ORIGIN || '').split(',').filter(Boolean),
      credentials: true,
    },
    path: '/pvp-socket',
  })

  // Auth middleware
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

    console.log(`[PvP] ${socket.login} connected`)

    // Join queue
    socket.on('pvp:join', (data: { topicIds: number[]; questionCount: number; timePerQuestion: number; strictTopics: boolean; powerupIds?: string[] }) => {
      if (isInQueue(uid) || getPlayerGame(uid)) {
        socket.emit('pvp:error', { message: 'Уже в очереди или в игре' })
        return
      }

      const elo = db.prepare('SELECT rating FROM elo_ratings WHERE user_id = ?').get(uid) as { rating: number } | undefined
      if (!elo) db.prepare('INSERT OR IGNORE INTO elo_ratings (user_id, rating) VALUES (?, 1000)').run(uid)

      joinQueue({
        userId: uid,
        login: socket.login!,
        nickname: socket.nickname!,
        rating: elo?.rating || 1000,
        topicIds: data.topicIds,
        questionCount: data.questionCount,
        timePerQuestion: data.timePerQuestion,
        strictTopics: data.strictTopics,
        powerupIds: data.powerupIds || [],
        joinedAt: Date.now(),
      })

      socket.emit('pvp:waiting')
      tryMatch(io)
    })

    // Cancel queue
    socket.on('pvp:cancel', () => {
      leaveQueue(uid)
      socket.emit('pvp:cancelled')
    })

    // Answer
    socket.on('pvp:answer', (data: { questionIndex: number; answer: string; timeElapsedCs: number }) => {
      const game = getPlayerGame(uid)
      if (!game) { socket.emit('pvp:error', { message: 'Нет активной игры' }); return }

      const result = recordAnswer(game, uid, data.questionIndex, data.answer, data.timeElapsedCs)
      if (!result) { socket.emit('pvp:error', { message: 'Неверный вопрос' }); return }

      // Tell the answering player if they were correct
      socket.emit('pvp:answer-result', { correct: result.correct, correctAnswer: result.correctAnswer, points: result.points })

      // Tell opponent
      const oppId = getOpponentUserId(game, uid)
      const oppSocket = findSocket(io, oppId)
      if (oppSocket) oppSocket.emit('pvp:opponent', { questionIndex: data.questionIndex })

      // If both answered, advance
      const ans = game.answers.get(data.questionIndex) || []
      if (ans.length >= 2 && game.currentQuestionIndex < game.questions.length - 1) {
        game.currentQuestionIndex++
        sendQuestion(io, game)
      } else if (game.currentQuestionIndex >= game.questions.length - 1 && ans.length >= 2) {
        // Game over — both answered last question
        finishGame(io, game)
      }
    })

    // Powerup
    socket.on('pvp:use-powerup', (data: { powerupId: string }) => {
      const game = getPlayerGame(uid)
      if (!game) { socket.emit('pvp:error', { message: 'Нет активной игры' }); return }

      const oppId = getOpponentUserId(game, uid)
      const oppSocket = findSocket(io, oppId)

      if (data.powerupId === 'freeze' && oppSocket) {
        // Opponent loses 5 seconds on current question
        oppSocket.emit('pvp:powerup-opponent', { powerupId: 'freeze', effect: 'Соперник заморозил ваш таймер на 5 сек!' })
        socket.emit('pvp:powerup-self', { powerupId: 'freeze', effect: 'Заморозка активирована' })
      }
    })
    socket.on('pvp:rematch', () => {
      const game = getPlayerGame(uid)
      if (game) return // Still in a game

      // Find opponent from last game
      socket.emit('pvp:error', { message: 'Рематч пока недоступен' })
    })

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[PvP] ${socket.login} disconnected`)
      leaveQueue(uid)

      const game = getPlayerGame(uid)
      if (game) {
        // Start disconnect timer
        const dcTimeout = setTimeout(() => {
          const g = getPlayerGame(uid)
          if (g) {
            const results = calculateResults(g, uid)
            const p1Socket = findSocket(io, g.player1.userId)
            const p2Socket = findSocket(io, g.player2.userId)
            if (p1Socket) p1Socket.emit('pvp:game-result', results.p1Result)
            if (p2Socket) p2Socket.emit('pvp:game-result', results.p2Result)
          }
        }, 15000)

        if (game.player1.userId === uid) game.disconnect1 = dcTimeout
        else game.disconnect2 = dcTimeout
      }
    })
  })

  return io
}

function tryMatch(io: SocketServer) {
  const match = findMatch()
  if (!match) return

  // Fetch questions
  // Use p1's topics for strict mode; merge both for non-strict
  const topicIds = match.p1.strictTopics
    ? match.p1.topicIds
    : [...new Set([...match.p1.topicIds, ...match.p2.topicIds])]
  const totalQ = match.p1.questionCount
  const qPerTopic = Math.floor(totalQ / topicIds.length / 2) * 2
  const remaining = totalQ - qPerTopic * topicIds.length

  const questions: PvPQuestion[] = []

  for (let i = 0; i < topicIds.length; i++) {
    const count = i < remaining ? qPerTopic + 1 : qPerTopic
    const rows = db.prepare(
      `SELECT q.id, q.text, q.answer_1, q.answer_2, q.answer_3, q.answer_4, q.correct_index, q.note, t.name as topic_name
       FROM questions q JOIN topics t ON t.id = q.topic_id
       WHERE q.topic_id = ?
       ORDER BY RANDOM()
       LIMIT ?`,
    ).all(topicIds[i], count) as Array<{
      id: number; text: string; answer_1: string; answer_2: string; answer_3: string; answer_4: string; correct_index: number; note: string | null; topic_name: string
    }>

    for (const row of rows) {
      const answers = [row.answer_1, row.answer_2, row.answer_3, row.answer_4]
      const correctAnswer = answers[row.correct_index]
      const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5)
      const shuffled = indices.map((j) => answers[j])
      const newCorrectIndex = shuffled.indexOf(correctAnswer)
      questions.push({
        id: row.id,
        text: row.text,
        answers: shuffled,
        correctIndex: newCorrectIndex,
        topicName: row.topic_name,
        note: row.note,
      })
    }
  }

  // Shuffle questions
  questions.sort(() => Math.random() - 0.5)

  const p1Entry = match.p1
  const p2Entry = match.p2

  const game = createGame(
    { userId: p1Entry.userId, login: p1Entry.login, nickname: p1Entry.nickname, rating: p1Entry.rating },
    { userId: p2Entry.userId, login: p2Entry.login, nickname: p2Entry.nickname, rating: p2Entry.rating },
    questions,
    topicIds,
    p1Entry.questionCount,
    p1Entry.timePerQuestion,
  )

  const p1Socket = findSocket(io, p1Entry.userId)
  const p2Socket = findSocket(io, p2Entry.userId)

  const topicNames = db.prepare(
    `SELECT name FROM topics WHERE id IN (${topicIds.map(() => '?').join(',')})`,
  ).all(...topicIds) as Array<{ name: string }>

  if (p1Socket) p1Socket.emit('pvp:match-found', {
    opponent: { id: p2Entry.userId, login: p2Entry.login, nickname: p2Entry.nickname, rating: p2Entry.rating },
    questions: questions.map((q) => ({ ...q, correctIndex: -1 })),
    topicNames: topicNames.map((t) => t.name),
    timePerQuestion: p1Entry.timePerQuestion,
  })

  if (p2Socket) p2Socket.emit('pvp:match-found', {
    opponent: { id: p1Entry.userId, login: p1Entry.login, nickname: p1Entry.nickname, rating: p1Entry.rating },
    questions: questions.map((q) => ({ ...q, correctIndex: -1 })),
    topicNames: topicNames.map((t) => t.name),
    timePerQuestion: p2Entry.timePerQuestion,
  })

  // 5-second countdown before first question
  let count = 5
  const countdownInterval = setInterval(() => {
    count--
    if (count <= 0) {
      clearInterval(countdownInterval)
      sendQuestion(io, game)
      return
    }
    if (p1Socket) p1Socket.emit('pvp:countdown', { seconds: count })
    if (p2Socket) p2Socket.emit('pvp:countdown', { seconds: count })
  }, 1000)
  // Store reference for cleanup
  game.countdownInterval = countdownInterval
  // Emit initial 5
  if (p1Socket) p1Socket.emit('pvp:countdown', { seconds: 5 })
  if (p2Socket) p2Socket.emit('pvp:countdown', { seconds: 5 })
}

function sendQuestion(io: SocketServer, game: PvPGame) {
  const q = game.questions[game.currentQuestionIndex]
  if (!q) return

  if (game.timer) clearTimeout(game.timer)

  startQuestionTimer(game, (g) => {
    // Time's up for current question
    if (g.currentQuestionIndex < g.questions.length - 1) {
      g.currentQuestionIndex++
      sendQuestion(io, g)
    } else {
      finishGame(io, g)
    }
  })

  const data = { index: game.currentQuestionIndex, question: { id: q.id, text: q.text, answers: q.answers, topicName: q.topicName, note: q.note } }
  const p1Socket = findSocket(io, game.player1.userId)
  const p2Socket = findSocket(io, game.player2.userId)
  if (p1Socket) p1Socket.emit('pvp:question', data)
  if (p2Socket) p2Socket.emit('pvp:question', data)
}

function finishGame(io: SocketServer, game: PvPGame) {
  clearGameTimer(game)
  const results = calculateResults(game)

  const p1Socket = findSocket(io, game.player1.userId)
  const p2Socket = findSocket(io, game.player2.userId)
  if (p1Socket) p1Socket.emit('pvp:game-result', results.p1Result)
  if (p2Socket) p2Socket.emit('pvp:game-result', results.p2Result)
}

function findSocket(io: SocketServer, userId: number): AuthSocket | undefined {
  for (const [, socket] of io.sockets.sockets) {
    if ((socket as AuthSocket).userId === userId) return socket as AuthSocket
  }
  return undefined
}
