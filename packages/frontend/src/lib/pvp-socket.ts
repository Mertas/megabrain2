import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = window.location.origin
const PATH = '/pvp-socket'

let socket: Socket | null = null

export interface PvPQuestion {
  id: number
  text: string
  answers: string[]
  topicName?: string
  note?: string | null
}

export interface PvPMatchFound {
  opponent: { id: number; login: string; nickname: string; rating: number }
  questions: PvPQuestion[]
  topicNames: string[]
  timePerQuestion: number
}

export interface PvPResult {
  yourScore: number
  opponentScore: number
  yourEloChange: number
  yourNewRating: number
  opponent: { id: number; login: string; nickname: string; newRating: number }
  breakdown: {
    yourAnswer: string | null
    opponentAnswer: string | null
    correctAnswer: string
    correct: boolean
    opponentCorrect: boolean
    yourPoints: number
  }[]
}

export function connect(token: string): Socket {
  if (!token) {
    console.error('[PvP] No token provided')
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

  socket.on('connect', () => console.log('[PvP] connected'))
  socket.on('disconnect', () => console.log('[PvP] disconnected'))
  socket.on('connect_error', (err) => console.error('[PvP] connect error:', err.message))

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

export function joinQueue(topicIds: number[], questionCount: number, timePerQuestion: number, strictTopics: boolean, powerupIds: string[] = []): void {
  socket?.emit('pvp:join', { topicIds, questionCount, timePerQuestion, strictTopics, powerupIds })
}

export function cancelQueue(): void {
  socket?.emit('pvp:cancel')
}

export function sendAnswer(questionIndex: number, answer: string, timeElapsedCs: number): void {
  socket?.emit('pvp:answer', { questionIndex, answer, timeElapsedCs })
}

export function usePowerup(powerupId: string): void {
  socket?.emit('pvp:use-powerup', { powerupId })
}

export function rematch(): void {
  socket?.emit('pvp:rematch')
}
