import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { authRouter } from './modules/auth/auth.routes.js'
import { topicsRouter } from './modules/topics/topics.routes.js'
import { gameRouter } from './modules/game/game.routes.js'
import { errorHandler } from './middleware/error.middleware.js'

import { publicRouter } from './modules/public/public.routes.js'
import { adminRouter } from './modules/admin/admin.routes.js'
import { usersRouter } from './modules/users/users.routes.js'
import { pvpRouter } from './modules/pvp/pvp.routes.js'
import { survivalRouter } from './modules/survival/survival.routes.js'
import { blitzRouter } from './modules/blitz/blitz.routes.js'
import { powerupsRouter } from './modules/powerups/powerups.routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isDev = process.env.NODE_ENV !== 'production'

const allowedOrigins = isDev
  ? ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:4173']
  : (process.env.CORS_ORIGIN || '').split(',').filter(Boolean)

export function createApp() {
  const app = express()

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }))

  app.use(cors({
    origin: isDev
      ? allowedOrigins
      : (allowedOrigins.length > 0 ? allowedOrigins : false),
    credentials: true,
  }))
  app.use(express.json({ limit: '5mb' }))

  app.use('/api/auth', authRouter)
  app.use('/api/topics', topicsRouter)
  app.use('/api/game', gameRouter)
  app.use('/api/public', publicRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/pvp', pvpRouter)
  app.use('/api/survival', survivalRouter)
  app.use('/api/blitz', blitzRouter)
  app.use('/api/powerups', powerupsRouter)

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  // Serve frontend in production (Docker/Render)
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, '../../frontend/dist')
    app.use(express.static(distPath))
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.use(errorHandler)

  return app
}
