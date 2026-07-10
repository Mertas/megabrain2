import { db } from '../db/connection.js'
import { hashPassword } from '../lib/password.js'
import { setupDatabase } from '../db/schema.js'
import { seed } from '../db/seed.js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const adjectives = ['Brave', 'Calm', 'Cool', 'Crisp', 'Daring', 'Eager', 'Fair', 'Fierce', 'Fine', 'Fresh', 'Glad', 'Grand', 'Happy', 'Jolly', 'Keen', 'Lively', 'Lone', 'Lucky', 'Merry', 'Neat', 'Noble', 'Posh', 'Proud', 'Pure', 'Quick', 'Rare', 'Sharp', 'Sly', 'Smart', 'Soft', 'Stark', 'Super', 'Swift', 'Tame', 'Wild', 'Wise', 'Zesty']
const colors = ['Amber', 'Aqua', 'Ash', 'Blue', 'Copper', 'Coral', 'Crimson', 'Ebony', 'Gold', 'Gray', 'Green', 'Indigo', 'Ivory', 'Jade', 'Lilac', 'Magenta', 'Mint', 'Navy', 'Onyx', 'Pearl', 'Pink', 'Plum', 'Red', 'Rose', 'Ruby', 'Rust', 'Sage', 'Scarlet', 'Silver', 'Slate', 'Teal', 'Violet', 'White']
const animals = ['Badger', 'Bear', 'Cat', 'Crane', 'Deer', 'Dog', 'Dove', 'Elk', 'Falcon', 'Fox', 'Hare', 'Hawk', 'Heron', 'Ibis', 'Jay', 'Kite', 'Lark', 'Lynx', 'Mink', 'Mole', 'Moose', 'Otter', 'Owl', 'Puma', 'Quail', 'Raven', 'Sable', 'Seal', 'Shark', 'Steed', 'Swan', 'Tiger', 'Trout', 'Viper', 'Wolf']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function nameExists(login: string): boolean {
  return db.prepare('SELECT 1 FROM users WHERE login = ?').get(login) != null
}

async function main() {
  setupDatabase()
  seed()

  // Build all color+animal combos
  const combos: string[] = []
  for (const c of colors) {
    for (const a of animals) {
      combos.push(`${c}${a}`)
      for (const adj of adjectives) {
        combos.push(`${adj}${c}${a}`)
      }
    }
  }

  const shuffled = shuffle(combos)
  const insert = db.prepare('INSERT INTO users (login, email, password, nickname) VALUES (?, ?, ?, ?)')
  const created: { login: string; password: string }[] = []

  for (const name of shuffled) {
    if (created.length >= 2) break
    if (nameExists(name)) continue
    const password = 'TestPass1'
    const hash = await hashPassword(password)
    insert.run(name, `${name.toLowerCase()}@example.com`, hash, name)
    console.log(`[SEED] ${name} / ${password}`)
    created.push({ login: name, password })
    db.prepare('INSERT OR IGNORE INTO elo_ratings (user_id, rating) VALUES ((SELECT id FROM users WHERE login = ?), 1000)').run(name)
    db.prepare('INSERT OR IGNORE INTO blitz_ratings (user_id, rating) VALUES ((SELECT id FROM users WHERE login = ?), 1000)').run(name)
  }

  if (created.length < 2) {
    for (let i = created.length; i < 2; i++) {
      const fallback = `TestFox${Date.now().toString(36)}`
      const hash = await hashPassword('TestPass1')
      insert.run(fallback, `${fallback.toLowerCase()}@example.com`, hash, fallback)
      console.log(`[SEED] ${fallback} / TestPass1`)
      created.push({ login: fallback, password: 'TestPass1' })
    }
  }

  const __dirname = dirname(fileURLToPath(import.meta.url))
  const fixturesDir = resolve(__dirname, '../../../frontend/cypress/fixtures')
  mkdirSync(fixturesDir, { recursive: true })
  writeFileSync(resolve(fixturesDir, 'test-users.json'), JSON.stringify(created, null, 2))

  console.log(`[SEED] ${created.length} test users: ${created.map((c) => c.login).join(', ')}`)
}

main()
