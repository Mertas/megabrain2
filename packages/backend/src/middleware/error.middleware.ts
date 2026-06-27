import type { Request, Response, NextFunction } from 'express'
import { AuthError } from '../modules/auth/auth.service.js'
import { ZodError } from 'zod'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AuthError) {
    res.status(err.status).json({ error: err.code, message: err.message })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    })
    return
  }

  console.error('[ERROR]', err)
  res.status(500).json({ error: 'INTERNAL', message: 'Внутренняя ошибка сервера' })
}
