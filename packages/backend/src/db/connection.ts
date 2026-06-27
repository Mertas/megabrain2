import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { env } from '../lib/env.js'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const dbDir = dirname(env.DB_PATH)
mkdirSync(dbDir, { recursive: true })

const db: DatabaseType = new Database(env.DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export { db }
