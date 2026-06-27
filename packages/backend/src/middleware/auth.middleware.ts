import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt.js'

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Требуется авторизация' })
    return
  }

  const token = header.slice(7)

  try {
    const payload = verifyAccessToken(token)
    if (payload.type !== 'access') {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Не access-токен' })
      return
    }
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'INVALID_TOKEN', message: 'Невалидный токен' })
  }
}
