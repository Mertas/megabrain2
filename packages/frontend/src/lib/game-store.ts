import type { Question, GameResult } from '../components/organisms/GameBoard/GameBoard'
import type { GameScoreResult } from './api'

export interface GameStore {
  questions: Question[]
  timeMode: 'per_question' | 'per_game'
  timeSeconds: number
  powerupIds: string[]
  powerupTypes: object[]
  result: GameResult | null
  scoreResult: GameScoreResult | null
}

let store: GameStore = {
  questions: [],
  timeMode: 'per_question',
  timeSeconds: 60,
  powerupIds: [],
  powerupTypes: [],
  result: null,
  scoreResult: null,
}

export function getGameStore() { return store }
export function setGameStore(s: Partial<GameStore>) { store = { ...store, ...s } }
export function clearGameStore() { store = { questions: [], timeMode: 'per_question', timeSeconds: 60, powerupIds: [], powerupTypes: [], result: null, scoreResult: null } }
