import type { ZodError, ZodSchema } from 'zod'
import type { Request, Response, NextFunction } from 'express'

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req[source] = schema.parse(req[source])
      next()
    } catch (err) {
      const zodError = err as ZodError
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: zodError.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      })
    }
  }
}
