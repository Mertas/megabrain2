import { db } from '../../db/connection.js'

export interface PowerupType {
  id: string
  name: string
  description: string
  category: string
  cost: number
  max_per_game: number
  available_in: string
  icon: string
}

export interface UserPowerup {
  powerupId: string
  quantity: number
}

export function getAllTypes(): PowerupType[] {
  return db.prepare('SELECT * FROM powerup_types ORDER BY category, cost').all() as PowerupType[]
}

export function getType(id: string): PowerupType | undefined {
  return db.prepare('SELECT * FROM powerup_types WHERE id = ?').get(id) as PowerupType | undefined
}

export function getUserInventory(userId: number): UserPowerup[] {
  return db.prepare(
    'SELECT powerup_id as powerupId, quantity FROM user_powerups WHERE user_id = ? AND quantity > 0 ORDER BY powerup_id',
  ).all(userId) as UserPowerup[]
}

export function getUserPowerupQuantity(userId: number, powerupId: string): number {
  const row = db.prepare(
    'SELECT quantity FROM user_powerups WHERE user_id = ? AND powerup_id = ?',
  ).get(userId, powerupId) as { quantity: number } | undefined
  return row?.quantity || 0
}

export function addPowerup(userId: number, powerupId: string, quantity: number): void {
  const existing = getUserPowerupQuantity(userId, powerupId)
  if (existing > 0) {
    db.prepare('UPDATE user_powerups SET quantity = MIN(20, quantity + ?) WHERE user_id = ? AND powerup_id = ?').run(quantity, userId, powerupId)
  } else {
    db.prepare('INSERT INTO user_powerups (user_id, powerup_id, quantity) VALUES (?, ?, ?)').run(userId, powerupId, Math.min(20, quantity))
  }
}

export function removePowerup(userId: number, powerupId: string, quantity: number): boolean {
  const existing = getUserPowerupQuantity(userId, powerupId)
  if (existing < quantity) return false
  const newQty = existing - quantity
  if (newQty <= 0) {
    db.prepare('DELETE FROM user_powerups WHERE user_id = ? AND powerup_id = ?').run(userId, powerupId)
  } else {
    db.prepare('UPDATE user_powerups SET quantity = ? WHERE user_id = ? AND powerup_id = ?').run(newQty, userId, powerupId)
  }
  return true
}

export function buyPowerup(userId: number, powerupId: string, quantity: number): { ok: boolean; error?: string; newScore?: number } {
  const pu = getType(powerupId)
  if (!pu) return { ok: false, error: 'Неизвестный power-up' }

  const totalCost = pu.cost * quantity

  const user = db.prepare('SELECT score FROM users WHERE id = ?').get(userId) as { score: number } | undefined
  if (!user || user.score < totalCost) {
    return { ok: false, error: 'Недостаточно очков' }
  }

  const currentQty = getUserPowerupQuantity(userId, powerupId)
  if (currentQty + quantity > 20) {
    return { ok: false, error: 'Нельзя иметь больше 20 шт одного типа' }
  }

  db.prepare('UPDATE users SET score = score - ? WHERE id = ?').run(totalCost, userId)
  addPowerup(userId, powerupId, quantity)
  const newScore = (db.prepare('SELECT score FROM users WHERE id = ?').get(userId) as { score: number }).score

  return { ok: true, newScore }
}

export function recordUsage(userId: number, powerupId: string, gameMode: string, gameId?: number): void {
  db.prepare('INSERT INTO powerup_usage (user_id, powerup_id, game_mode, game_id) VALUES (?, ?, ?, ?)').run(
    userId, powerupId, gameMode, gameId || null,
  )
}

export function giveRewardPowerup(userId: number): string | null {
  const allTypes = getAllTypes()
  const affordable = allTypes.filter((t) => t.cost <= 100)
  if (affordable.length === 0) return null
  const pick = affordable[Math.floor(Math.random() * affordable.length)]
  addPowerup(userId, pick.id, 1)
  return pick.id
}
