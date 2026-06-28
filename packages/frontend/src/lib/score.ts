export function calcScore(timeElapsedCs: number, timeMode: 'per_question' | 'per_game', timeSeconds: number, totalQuestions: number, correct: boolean): number {
  if (!correct) return 0
  if (timeSeconds <= 0) return 1

  const L = timeMode === 'per_game'
    ? (timeSeconds * 100) / totalQuestions
    : timeSeconds * 100

  if (L <= 0) return 10

  const points = 10 * Math.pow(0.1, timeElapsedCs / L)
  return Math.round(points * 100) / 100
}
