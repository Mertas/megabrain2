export interface Subtopic {
  id: number
  name: string
}

export interface Topic {
  id: number
  name: string
  icon: string
  subtopics: Subtopic[]
}

export interface Question {
  text: string
  imageUrl?: string
  answers: string[]
  correctIndex: number
}

export interface GameResult {
  total: number
  correct: number
  timeCs: number
  questions: { question: Question; selectedIndex: number | null }[]
}

export interface GameConfig {
  subtopicIds: number[]
  timeMode: 'per_question' | 'per_game'
  timeValueSeconds: number
  questionCount: number
  onlyNew: boolean
}
