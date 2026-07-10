import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { db } from '../../db/connection.js'
import {
  getAllTypes,
  getUserInventory,
  buyPowerup,
  removePowerup,
  getType,
  recordUsage,
} from './powerups.service.js'

export const powerupsRouter = Router()

powerupsRouter.get('/types', (_req, res) => {
  res.json(getAllTypes())
})

powerupsRouter.get('/inventory', authenticate, (req, res) => {
  const inventory = getUserInventory(req.userId!)
  const user = db.prepare('SELECT score FROM users WHERE id = ?').get(req.userId) as { score: number } | undefined
  res.json({ inventory, score: user?.score || 0 })
})

powerupsRouter.post('/buy', authenticate, (req, res) => {
  const { powerupId, quantity } = req.body as { powerupId: string; quantity: number }
  if (!powerupId) {
    res.status(400).json({ error: 'INVALID', message: 'Нужен powerupId' })
    return
  }
  const qty = Math.max(1, Math.min(10, quantity || 1))
  const result = buyPowerup(req.userId!, powerupId, qty)
  if (!result.ok) {
    res.status(400).json({ error: 'BUY_FAILED', message: result.error })
    return
  }
  res.json({ ok: true, newScore: result.newScore })
})

powerupsRouter.post('/use', authenticate, (req, res) => {
  const { powerupId, gameMode, gameId } = req.body as { powerupId: string; gameMode: string; gameId?: number }

  if (!powerupId) {
    res.status(400).json({ error: 'INVALID', message: 'Нужен powerupId' })
    return
  }

  const pu = getType(powerupId)
  if (!pu) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Неизвестный power-up' })
    return
  }

  const success = removePowerup(req.userId!, powerupId, 1)
  if (!success) {
    res.status(400).json({ error: 'NO_ITEMS', message: 'Нет такого power-up в инвентаре' })
    return
  }

  recordUsage(req.userId!, powerupId, gameMode, gameId)

  res.json({ ok: true, effect: { type: powerupId, name: pu.name, icon: pu.icon } })
})
