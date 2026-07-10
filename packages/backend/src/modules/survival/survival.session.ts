export interface SurvivalQuestionRecord {
  questionId: number
  questionIndex: number
  correct: boolean
  timeElapsedCs: number
  points: number
  streakAtMoment: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface SurvivalSession {
  sessionId: string
  userId: number
  topicIds: number[]
  lives: number
  streak: number
  maxStreak: number
  score: number
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  timeLimitSeconds: number
  difficulty: 'easy' | 'medium' | 'hard'
  questions: SurvivalQuestionRecord[]
  askedQuestionIds: Set<number>
  createdAt: number
  lastActivity: number
}

const sessions = new Map<string, SurvivalSession>()

const SESSION_TTL_MS = 5 * 60 * 1000

export function createSession(sessionId: string, userId: number, topicIds: number[]): SurvivalSession {
  const session: SurvivalSession = {
    sessionId,
    userId,
    topicIds,
    lives: 3,
    streak: 0,
    maxStreak: 0,
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    timeLimitSeconds: 30,
    difficulty: 'easy',
    questions: [],
    askedQuestionIds: new Set(),
    createdAt: Date.now(),
    lastActivity: Date.now(),
  }
  sessions.set(sessionId, session)
  return session
}

export function getSession(sessionId: string): SurvivalSession | undefined {
  return sessions.get(sessionId)
}

export function touchSession(sessionId: string): void {
  const s = sessions.get(sessionId)
  if (s) s.lastActivity = Date.now()
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId)
}

export function cleanupSessions(): void {
  const now = Date.now()
  const toDelete: string[] = []
  for (const [id, s] of sessions) {
    if (now - s.lastActivity > SESSION_TTL_MS) {
      toDelete.push(id)
    }
  }
  for (const id of toDelete) {
    sessions.delete(id)
  }
}
