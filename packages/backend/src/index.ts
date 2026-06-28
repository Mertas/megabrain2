import { createServer } from 'http'
import { createApp } from './app.js'
import { createPvPServer } from './modules/pvp/pvp.socket.js'
import { setupDatabase } from './db/schema.js'
import { seed } from './db/seed.js'
import { env } from './lib/env.js'

setupDatabase()
seed()

const app = createApp()
const server = createServer(app)
createPvPServer(server)

server.listen(env.PORT, () => {
  console.log(`[Server] Running on http://localhost:${env.PORT}`)
  console.log(`[PvP] Socket.io ready on /pvp-socket`)
})
