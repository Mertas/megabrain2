import { defineConfig } from 'cypress'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5142',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: ['cypress/e2e/**/*.cy.ts', '!cypress/e2e/**/*.exclude.cy.ts'],
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    retries: { runMode: 1 },
    setupNodeEvents(on) {
      const bots: Map<string, any> = new Map()

      on('task', {
        async startBot({ mode, userIndex }: { mode: 'blitz' | 'pvp'; userIndex: number }) {
          const { io } = await import('socket.io-client')
          const { readFileSync } = await import('fs')

          const base = 'http://localhost:3042'
          const fixturePath = path.join(__dirname, 'cypress', 'fixtures', 'test-users.json')
          const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'))

          const idx = typeof userIndex === 'number' ? userIndex : 1
          const user = fixture[idx]
          if (!user) return { error: 'No test user at index ' + idx }

          // Login
          const loginRes = await fetch(`${base}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: user.login, password: user.password }),
          })
          const auth: any = await loginRes.json()
          const token = auth.accessToken

          // Get categories for topic IDs
          const catRes = await fetch(`${base}/api/topics`)
          const cats: any = await catRes.json()
          const firstCat = cats[0]
          const firstTopic = firstCat?.topics?.[0]
          const topicIds = firstTopic ? [firstTopic.id] : []

          const socketPath = mode === 'blitz' ? '/blitz-socket' : '/pvp-socket'
          const s = io(base, {
            path: socketPath,
            auth: { token },
            transports: ['polling', 'websocket'],
            timeout: 15000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
          })

          const joinEvent = mode === 'blitz' ? 'blitz:join' : 'pvp:join'

          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => { reject(new Error('Bot connect timeout')) }, 10000)

            s.on('connect', () => {
              if (mode === 'blitz') {
                s.emit(joinEvent, { topicIds, roundCount: 5, timePerRound: 15, powerupIds: [] })
              } else {
                s.emit(joinEvent, { topicIds, questionCount: 10, timePerQ: 30, strictTopics: false, powerupIds: [] })
              }
            })

            const answerEvent = mode === 'blitz' ? 'blitz:round-start' : 'pvp:question'
            const answerEmitEvent = mode === 'blitz' ? 'blitz:answer' : 'pvp:answer'

            s.on(answerEvent, (data: any) => {
              const answers = mode === 'blitz' ? data.question.answers : data.question.answers
              setTimeout(() => {
                if (s.connected) {
                  s.emit(answerEmitEvent, { answer: answers[0], timeCs: 50 })
                }
              }, 500)
            })

            s.on(mode === 'blitz' ? 'blitz:waiting' : 'pvp:waiting', () => {
              clearTimeout(timeout)
              resolve()
            })

            s.on('connect_error', (err: Error) => {
              clearTimeout(timeout)
              reject(err)
            })

            s.on('disconnect', (reason: string) => {
              clearTimeout(timeout)
              reject(new Error(`Bot disconnected: ${reason}`))
            })
          })

          const key = `bot-${mode}`
          if (bots.has(key)) {
            const old = bots.get(key)
            if (old) { try { old.disconnect() } catch { /* ignore */ } }
          }
          bots.set(key, s)

          return { ok: true, login: user.login }
        },

        stopBot({ mode }: { mode: 'blitz' | 'pvp' }) {
          const key = `bot-${mode}`
          const s = bots.get(key)
          if (s) {
            try { s.disconnect() } catch { /* ignore */ }
            bots.delete(key)
          }
          return null
        },

        stopAllBots() {
          for (const [, s] of bots) {
            try { s.disconnect() } catch { /* ignore */ }
          }
          bots.clear()
          return null
        },
      })
    },
  },
})
