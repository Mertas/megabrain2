import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = window.location.origin
const PATH = '/blitz-socket'

let socket: Socket | null = null

export interface BlitzQuestion {
  text: string
  answers: string[]
  note?: string | null
}

export interface BlitzMatchFound {
  opponent: { id: number; login: string; nickname: string; rating: number }
  roundCount: number
  timePerRound: number
}

export interface BlitzRoundResult {
  roundNumber: number
  winnerId: number | null
  p1: { answer: string | null; correct: boolean | null; timeCs: number | null }
  p2: { answer: string | null; correct: boolean | null; timeCs: number | null }
  correctAnswer: string
  scores: { p1: number; p2: number }
}

export interface BlitzGameResult {
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

export function connect(token: string): Socket {
  if (!token) {
    console.error('[Blitz] No token provided')
    throw new Error('No auth token')
  }

  if (socket?.connected) return socket
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }

  socket = io(SOCKET_URL, {
    path: PATH,
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => console.log('[Blitz] connected'))
  socket.on('disconnect', () => console.log('[Blitz] disconnected'))
  socket.on('connect_error', (err) => console.error('[Blitz] connect error:', err.message))

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnect(): void {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}

export function joinQueue(topicIds: number[], roundCount: number, timePerRound: number, powerupIds: string[] = []): void {
  socket?.emit('blitz:join', { topicIds, roundCount, timePerRound, powerupIds })
}

export function cancelQueue(): void {
  socket?.emit('blitz:cancel')
}

export function sendAnswer(answer: string, timeCs: number): void {
  socket?.emit('blitz:answer', { answer, timeCs })
}

export function usePowerup(powerupId: string): void {
  socket?.emit('blitz:use-powerup', { powerupId })
}
