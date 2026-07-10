export interface PvPQueueEntry {
  userId: number
  login: string
  nickname: string
  rating: number
  topicIds: number[]
  questionCount: number
  timePerQuestion: number
  strictTopics: boolean
  powerupIds: string[]
  joinedAt: number
}

export interface PvPGame {
  id: number
  player1: PvPQueueEntry
  player2: PvPQueueEntry
  questions: PvPQuestion[]
  questionCount: number
  timePerQuestion: number
  startedAt: number
  answers: Map<number, { userId: number; questionIndex: number; answer: string; timeElapsedCs: number; correct: boolean; points: number }[]>
  questionStartTs: number
  currentQuestionIndex: number
  timer: ReturnType<typeof setTimeout> | null
  disconnect1: ReturnType<typeof setTimeout> | null
  disconnect2: ReturnType<typeof setTimeout> | null
  countdownInterval: ReturnType<typeof setInterval> | null
  powerups: Map<number, { shield: boolean; doublePoints: boolean; freezeApplied: boolean; extraTime: number }>
}

export interface PvPQuestion {
  id: number
  text: string
  answers: string[]
  correctIndex: number
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
