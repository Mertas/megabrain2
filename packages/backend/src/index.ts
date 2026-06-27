import { createApp } from './app.js'
import { setupDatabase } from './db/schema.js'
import { env } from './lib/env.js'

setupDatabase()

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`[Server] Running on http://localhost:${env.PORT}`)
  console.log(`[Server] POST /api/auth/register`)
  console.log(`[Server] POST /api/auth/login`)
  console.log(`[Server] POST /api/auth/refresh`)
  console.log(`[Server] GET  /api/auth/me`)
})
