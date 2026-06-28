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

    CREATE TABLE IF NOT EXISTS game_results (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      total         INTEGER NOT NULL,
      correct       INTEGER NOT NULL,
      time_cs       INTEGER NOT NULL,
      times_up      INTEGER NOT NULL DEFAULT 0,
      score_awarded REAL    NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_result_questions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      game_result_id  INTEGER NOT NULL REFERENCES game_results(id) ON DELETE CASCADE,
      question_id     INTEGER NOT NULL,
      correct         INTEGER NOT NULL,
      time_elapsed_cs INTEGER NOT NULL,
      points          REAL    NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pvp_games (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      player1_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      player2_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      winner_id       INTEGER REFERENCES users(id),
      topic_ids       TEXT    NOT NULL,
      question_count  INTEGER NOT NULL,
      time_per_q      INTEGER NOT NULL,
      score_p1        REAL    NOT NULL DEFAULT 0,
      score_p2        REAL    NOT NULL DEFAULT 0,
      elo_change_p1   INTEGER NOT NULL DEFAULT 0,
      elo_change_p2   INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pvp_game_answers (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id         INTEGER NOT NULL REFERENCES pvp_games(id) ON DELETE CASCADE,
      user_id         INTEGER NOT NULL,
      question_id     INTEGER NOT NULL,
      correct         INTEGER NOT NULL,
      time_elapsed_cs  INTEGER NOT NULL,
      points          REAL    NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS elo_ratings (
      user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      rating          INTEGER NOT NULL DEFAULT 1000,
      wins            INTEGER NOT NULL DEFAULT 0,
      losses          INTEGER NOT NULL DEFAULT 0,
      draws           INTEGER NOT NULL DEFAULT 0
    );
  `)

  // Migration: add author_id for existing tables
  try { db.exec('ALTER TABLE questions ADD COLUMN author_id INTEGER REFERENCES users(id)') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE questions ADD COLUMN note TEXT') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE users ADD COLUMN last_game_config TEXT') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE users ADD COLUMN score INTEGER NOT NULL DEFAULT 0') } catch { /* already exists */ }

  console.log('[DB] Tables created/verified')
}

// Run directly: tsx src/db/schema.ts
const isMain = process.argv[1]?.endsWith('schema.ts')
if (isMain) {
  setupDatabase()
  console.log('[DB] Setup complete')
}
