import type { BlitzQueueEntry, BlitzGame } from './blitz.types.js'

const queue: BlitzQueueEntry[] = []

export function joinQueue(entry: BlitzQueueEntry): void {
  queue.push(entry)
}

export function leaveQueue(userId: number): void {
  const idx = queue.findIndex((e) => e.userId === userId)
  if (idx !== -1) queue.splice(idx, 1)
}

export function isInQueue(userId: number): boolean {
  return queue.some((e) => e.userId === userId)
}

export function findMatch(): { p1: BlitzQueueEntry; p2: BlitzQueueEntry } | null {
  for (let i = 0; i < queue.length; i++) {
    for (let j = i + 1; j < queue.length; j++) {
      const a = queue[i]
      const b = queue[j]
      if (a.roundCount !== b.roundCount) continue
      if (a.timePerRound !== b.timePerRound) continue
      const aSet = new Set(a.topicIds)
      const bSet = new Set(b.topicIds)
      const hasCommon = [...aSet].some((id) => bSet.has(id))
      if (!hasCommon) continue
      queue.splice(j, 1)
      queue.splice(i, 1)
      return { p1: a, p2: b }
    }
  }
  return null
}

const games = new Map<number, BlitzGame>()

export function addGame(game: BlitzGame): void {
  games.set(game.id, game)
}

export function getGame(id: number): BlitzGame | undefined {
  return games.get(id)
}

export function removeGame(id: number): void {
  games.delete(id)
}

export function getPlayerGame(userId: number): BlitzGame | undefined {
  for (const game of games.values()) {
    if (game.player1.userId === userId || game.player2.userId === userId) return game
  }
  return undefined
}
