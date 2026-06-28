import express from 'express'
import cors from 'cors'
import { authRouter } from './modules/auth/auth.routes.js'
import { topicsRouter } from './modules/topics/topics.routes.js'
import { gameRouter } from './modules/game/game.routes.js'
import { errorHandler } from './middleware/error.middleware.js'

import { publicRouter } from './modules/public/public.routes.js'
import { adminRouter } from './modules/admin/admin.routes.js'
import { usersRouter } from './modules/users/users.routes.js'
import { pvpRouter } from './modules/pvp/pvp.routes.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json({ limit: '5mb' }))

  app.use('/api/auth', authRouter)
  app.use('/api/topics', topicsRouter)
  app.use('/api/game', gameRouter)
  app.use('/api/public', publicRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/pvp', pvpRouter)

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use(errorHandler)

  return app
}
