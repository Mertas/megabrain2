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

    CREATE TABLE IF NOT EXISTS survival_games (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic_ids             TEXT    NOT NULL,
      total_questions       INTEGER NOT NULL,
      correct_answers       INTEGER NOT NULL,
      wrong_answers         INTEGER NOT NULL,
      max_streak            INTEGER NOT NULL DEFAULT 0,
      final_streak          INTEGER NOT NULL DEFAULT 0,
      lives_left            INTEGER NOT NULL DEFAULT 0,
      total_score           REAL    NOT NULL DEFAULT 0,
      total_time_cs         INTEGER NOT NULL DEFAULT 0,
      difficulty_reached    INTEGER NOT NULL DEFAULT 1,
      created_at            TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS survival_game_questions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id          INTEGER NOT NULL REFERENCES survival_games(id) ON DELETE CASCADE,
      question_id      INTEGER NOT NULL REFERENCES questions(id),
      question_index   INTEGER NOT NULL,
      correct          INTEGER NOT NULL,
      time_elapsed_cs  INTEGER NOT NULL,
      points           REAL    NOT NULL DEFAULT 0,
      streak_at_moment INTEGER NOT NULL,
      difficulty_level INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS blitz_games (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      player1_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      player2_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      winner_id       INTEGER REFERENCES users(id),
      topic_ids       TEXT    NOT NULL,
      round_count     INTEGER NOT NULL,
      time_per_round  INTEGER NOT NULL,
      score_p1        INTEGER NOT NULL DEFAULT 0,
      score_p2        INTEGER NOT NULL DEFAULT 0,
      elo_change_p1   INTEGER NOT NULL DEFAULT 0,
      elo_change_p2   INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blitz_game_rounds (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id       INTEGER NOT NULL REFERENCES blitz_games(id) ON DELETE CASCADE,
      round_number  INTEGER NOT NULL,
      question_id   INTEGER NOT NULL REFERENCES questions(id),
      winner_id     INTEGER REFERENCES users(id),
      p1_answer     TEXT,
      p1_correct    INTEGER,
      p1_time_cs    INTEGER,
      p2_answer     TEXT,
      p2_correct    INTEGER,
      p2_time_cs    INTEGER
    );

    CREATE TABLE IF NOT EXISTS blitz_ratings (
      user_id  INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      rating   INTEGER NOT NULL DEFAULT 1000,
      wins     INTEGER NOT NULL DEFAULT 0,
      losses   INTEGER NOT NULL DEFAULT 0,
      draws    INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS powerup_types (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      description   TEXT NOT NULL,
      category      TEXT NOT NULL CHECK(category IN ('offensive','defensive','utility','global')),
      cost          INTEGER NOT NULL DEFAULT 50,
      max_per_game  INTEGER NOT NULL DEFAULT 1,
      available_in  TEXT NOT NULL DEFAULT 'all',
      icon          TEXT NOT NULL DEFAULT '?'
    );

    CREATE TABLE IF NOT EXISTS user_powerups (
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      powerup_id  TEXT NOT NULL REFERENCES powerup_types(id),
      quantity    INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, powerup_id)
    );

    CREATE TABLE IF NOT EXISTS powerup_usage (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      powerup_id  TEXT NOT NULL,
      game_mode   TEXT NOT NULL,
      game_id     INTEGER,
      used_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Seed powerup types
  const seedPowerups = db.prepare(
    'INSERT OR IGNORE INTO powerup_types (id, name, description, category, cost, max_per_game, available_in, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  )
  const powerups = [
    ['fifty-fifty', '50:50', 'Убирает 2 неверных ответа', 'utility', 40, 1, 'all', '\u{1F3AF}'],
    ['extra-time', 'Доп. время', '+10 сек на вопрос (+5 в PvP/Blitz)', 'defensive', 30, 1, 'all', '\u23F3'],
    ['double-points', '×2 Очка', '×2 очка за следующий верный ответ', 'utility', 50, 1, 'all', '\u2728'],
    ['skip-safe', 'Пропуск', 'Пропустить вопрос без потери стрика/жизни', 'utility', 40, 1, 'solo,survival', '\u{1F504}'],
    ['shield', 'Щит', 'Одна ошибка не засчитывается', 'defensive', 80, 1, 'all', '\u{1F6E1}'],
    ['freeze', 'Заморозка', 'Соперник теряет 5 сек на вопросе', 'offensive', 80, 1, 'pvp,blitz', '\u2744\uFE0F'],
    ['peek', 'Подсказка', 'Показывает правильный ответ (0 очков за вопрос)', 'utility', 200, 1, 'all', '\u{1F441}'],
    ['second-chance', 'Второй шанс', 'Позволяет ответить ещё раз после ошибки', 'utility', 60, 1, 'solo,survival', '\u{1F501}'],
    ['streak-saver', 'Сохр. стрика', 'При ошибке стрик падает наполовину, а не в 0', 'defensive', 120, 1, 'solo,survival', '\u{1F525}'],
    ['score-boost', 'Буст очков', '+25% ко всем очкам за игру', 'global', 180, 1, 'solo,pvp', '\u{1F4C8}'],
    ['head-start', 'Фора', 'Начать Survival с 5 жизнями вместо 3', 'global', 250, 1, 'survival', '\u{1F680}'],
    ['extra-slot', 'Доп. слот', '+1 слот для power-ups в этой игре (макс 4)', 'global', 300, 1, 'all', '\u{1F392}'],
  ]
  for (const p of powerups) {
    seedPowerups.run(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7])
  }

  // Migration: add author_id for existing tables
  try { db.exec('ALTER TABLE questions ADD COLUMN author_id INTEGER REFERENCES users(id)') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE questions ADD COLUMN note TEXT') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE users ADD COLUMN last_game_config TEXT') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE users ADD COLUMN score INTEGER NOT NULL DEFAULT 0') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE users ADD COLUMN best_survival_score REAL NOT NULL DEFAULT 0') } catch { /* already exists */ }
  try { db.exec('ALTER TABLE users ADD COLUMN best_survival_streak INTEGER NOT NULL DEFAULT 0') } catch { /* already exists */ }

  console.log('[DB] Tables created/verified')
}

// Run directly: tsx src/db/schema.ts
const isMain = process.argv[1]?.endsWith('schema.ts')
if (isMain) {
  setupDatabase()
  console.log('[DB] Setup complete')
}
