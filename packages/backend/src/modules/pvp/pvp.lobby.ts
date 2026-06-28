import type { PvPQueueEntry, PvPGame } from './pvp.types.js'

const queue: PvPQueueEntry[] = []

export function joinQueue(entry: PvPQueueEntry): void {
  queue.push(entry)
}

export function leaveQueue(userId: number): void {
  const idx = queue.findIndex((e) => e.userId === userId)
  if (idx !== -1) queue.splice(idx, 1)
}

export function isInQueue(userId: number): boolean {
  return queue.some((e) => e.userId === userId)
}

export function findMatch(): { p1: PvPQueueEntry; p2: PvPQueueEntry } | null {
  for (let i = 0; i < queue.length; i++) {
    for (let j = i + 1; j < queue.length; j++) {
      const a = queue[i]
      const b = queue[j]
      if (a.questionCount !== b.questionCount) continue
      if (a.timePerQuestion !== b.timePerQuestion) continue

      // Both must agree on strict matching mode
      if (a.strictTopics !== b.strictTopics) continue

      if (a.strictTopics) {
        // Must have exact same topic set
        const aSet = new Set(a.topicIds)
        const bSet = new Set(b.topicIds)
        if (aSet.size !== bSet.size) continue
        if (![...aSet].every((id) => bSet.has(id))) continue
      }
      // Non-strict: any topics match

      queue.splice(j, 1)
      queue.splice(i, 1)
      return { p1: a, p2: b }
    }
  }
  return null
}

export function getQueueSize(): number {
  return queue.length
}

// Active games
const games = new Map<number, PvPGame>()

export function addGame(game: PvPGame): void {
  games.set(game.id, game)
}

export function getGame(id: number): PvPGame | undefined {
  return games.get(id)
}

export function removeGame(id: number): void {
  games.delete(id)
}

export function getPlayerGame(userId: number): PvPGame | undefined {
  for (const game of games.values()) {
    if (game.player1.userId === userId || game.player2.userId === userId) return game
  }
  return undefined
}
