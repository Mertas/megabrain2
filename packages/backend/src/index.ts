import { createServer } from 'http'
import { createApp } from './app.js'
import { createPvPServer } from './modules/pvp/pvp.socket.js'
import { createBlitzServer } from './modules/blitz/blitz.socket.js'
import { setupDatabase } from './db/schema.js'
import { seed } from './db/seed.js'
import { env } from './lib/env.js'
import { cleanupSessions } from './modules/survival/survival.session.js'

setupDatabase()
seed()

const app = createApp()
const server = createServer(app)
createPvPServer(server)
createBlitzServer(server)

server.listen(env.PORT, () => {
  console.log(`[Server] Running on http://localhost:${env.PORT}`)
  console.log(`[PvP] Socket.io ready on /pvp-socket`)
  console.log(`[Blitz] Socket.io ready on /blitz-socket`)
})

setInterval(cleanupSessions, 60_000)
