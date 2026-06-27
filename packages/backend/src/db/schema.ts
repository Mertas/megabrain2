import { db } from './connection.js'

export function setupDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      login       TEXT    NOT NULL UNIQUE,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      nickname    TEXT    NOT NULL,
      level       INTEGER NOT NULL DEFAULT 1,
      icon        TEXT    NOT NULL DEFAULT '♙',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT    NOT NULL UNIQUE,
      expires_at TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT    NOT NULL UNIQUE,
      expires_at TEXT    NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE,
      icon       TEXT    NOT NULL DEFAULT '§',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS topics (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS questions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id      INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      text          TEXT    NOT NULL,
      image_url     TEXT,
      answer_1      TEXT    NOT NULL,
      answer_2      TEXT    NOT NULL,
      answer_3      TEXT    NOT NULL,
      answer_4      TEXT    NOT NULL,
      correct_index INTEGER NOT NULL DEFAULT 0,
      author_id     INTEGER REFERENCES users(id),
      note          TEXT,
      explanation   TEXT,
      source        TEXT
    );
  `)

  // Migration: add author_id for existing tables
  try { db.exec('ALTER TABLE questions ADD COLUMN author_id INTEGER REFERENCES users(id)') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE questions ADD COLUMN note TEXT') } catch { /* already exists */ }

  console.log('[DB] Tables created/verified')
}

// Run directly: tsx src/db/schema.ts
const isMain = process.argv[1]?.endsWith('schema.ts')
if (isMain) {
  setupDatabase()
  console.log('[DB] Setup complete')
}
