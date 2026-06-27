import express from 'express'
import cors from 'cors'
import { authRouter } from './modules/auth/auth.routes.js'
import { topicsRouter } from './modules/topics/topics.routes.js'
import { gameRouter } from './modules/game/game.routes.js'
import { errorHandler } from './middleware/error.middleware.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:6006'], credentials: true }))
  app.use(express.json({ limit: '5mb' }))

  app.use('/api/auth', authRouter)
  app.use('/api/topics', topicsRouter)
  app.use('/api/game', gameRouter)

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use(errorHandler)

  return app
}
