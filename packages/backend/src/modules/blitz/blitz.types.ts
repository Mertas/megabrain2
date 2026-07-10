export interface BlitzQueueEntry {
  userId: number
  login: string
  nickname: string
  rating: number
  topicIds: number[]
  roundCount: number
  timePerRound: number
  powerupIds: string[]
  joinedAt: number
}

export interface BlitzGame {
  id: number
  player1: BlitzPlayerState
  player2: BlitzPlayerState
  topicIds: number[]
  roundCount: number
  timePerRound: number
  currentRound: number
  rounds: BlitzRoundResult[]
  startedAt: number
  timer: ReturnType<typeof setTimeout> | null
  disconnect1: ReturnType<typeof setTimeout> | null
  disconnect2: ReturnType<typeof setTimeout> | null
  countdownInterval: ReturnType<typeof setInterval> | null
  powerups: Map<number, { shield: boolean; freezeApplied: boolean; extraTime: number }>
}

export interface BlitzPlayerState {
  userId: number
  login: string
  nickname: string
  rating: number
  roundsWon: number
  lockedOut: boolean
  answeredThisRound: boolean
}

export interface BlitzRoundResult {
  roundNumber: number
  questionId: number
  questionText: string
  answers: string[]
  correctIndex: number
  winnerId: number | null
  p1Answer: string | null
  p1Correct: boolean | null
  p1TimeCs: number | null
  p2Answer: string | null
  p2Correct: boolean | null
  p2TimeCs: number | null
  endedAt: number
}
