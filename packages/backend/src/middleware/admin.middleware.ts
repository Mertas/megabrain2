import type { Request, Response, NextFunction } from 'express'
import { db } from '../db/connection.js'

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  const row = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.userId) as { is_admin: number } | undefined
  if (!row || !row.is_admin) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Требуются права администратора' })
    return
  }
  next()
}
