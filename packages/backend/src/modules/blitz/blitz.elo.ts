const K = 32

export function calcElo(ratingA: number, ratingB: number, scoreA: number): { newA: number; newB: number; changeA: number; changeB: number } {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
  const expectedB = 1 - expectedA
  const scoreB = 1 - scoreA

  const changeA = Math.round(K * (scoreA - expectedA))
  const changeB = Math.round(K * (scoreB - expectedB))

  return {
    newA: ratingA + changeA,
    newB: ratingB + changeB,
    changeA,
    changeB,
  }
}
