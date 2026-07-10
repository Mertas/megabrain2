# 1. «Выживание» (Survival / Endless Mode)

> ✅ **Статус: Реализовано** (2026-07-06)

---

## Концепция

Игрок отвечает на вопросы из бесконечного пула. У него есть **3 жизни**. Каждый неверный ответ отнимает одну жизнь. При 0 жизней — игра окончена. По мере роста стрика (серии верных ответов) сложность растёт, а время на ответ сокращается. Цель — продержаться как можно дольше и набрать максимальный счёт.

## Ключевые параметры

| Параметр | Значение |
|----------|----------|
| Начальное количество жизней | **3** |
| Начальное время на вопрос | **30 сек** |
| Минимальное время на вопрос | **5 сек** |
| Уменьшение времени | **−0.5 сек за каждый верный ответ** |
| Порог «лёгких» вопросов | стрик 0–9: вопросы из выбранных игроком тем |
| Порог «средних» вопросов | стрик 10–24: +50% случайных тем из других категорий |
| Порог «сложных» вопросов | стрик 25+: все темы, включая непопулярные |
| Бафф «сердца» | Каждые 50 верных ответов — +1 жизнь (макс. 5) |
| Формула очков | `points = max(1, 10 * 0.1^(timeElapsed / (timeLimit * 100))) * streakMultiplier` |
| Множитель стрика | `streakMultiplier = 1 + floor(streak / 5) * 0.25` (каждые 5 верных подряд +0.25x, макс. 3x) |

## Схема стейт-машины

```
        ┌─────────┐
        │  SETUP  │  Выбор тем, старт
        └────┬────┘
             ▼
        ┌─────────┐
   ┌───►│ PLAYING │◄─────────┐
   │    └────┬────┘          │
   │         │               │
   │    ┌────▼────┐     ┌────┴────┐
   │    │ ANSWER  │     │ TIME UP │
   │    └────┬────┘     └────┬────┘
   │         │               │
   │    ┌────▼────┐          │
   ├────┤ CORRECT │          │ (жизнь −1)
   │    └─────────┘          │
   │                         │
   │    ┌─────────┐          │
   └────┤  WRONG  ├──────────┘
        │(жизнь−1)│
        └────┬────┘
             │
        ┌────▼────┐
        │lives > 0│──да──► PLAYING
        └────┬────┘
             │нет
             ▼
        ┌─────────┐
        │  GAME   │
        │  OVER   │
        └─────────┘
```

## Структура БД

### Таблица `survival_games`

```sql
CREATE TABLE survival_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  topic_ids TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  max_streak INTEGER NOT NULL DEFAULT 0,
  final_streak INTEGER NOT NULL DEFAULT 0,
  lives_left INTEGER NOT NULL DEFAULT 0,
  total_score REAL NOT NULL DEFAULT 0,
  total_time_cs INTEGER NOT NULL DEFAULT 0,
  difficulty_level_reached INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Таблица `survival_game_questions`

```sql
CREATE TABLE survival_game_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL REFERENCES survival_games(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  question_index INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  time_elapsed_cs INTEGER NOT NULL,
  points REAL NOT NULL DEFAULT 0,
  streak_at_moment INTEGER NOT NULL,
  difficulty_level INTEGER NOT NULL DEFAULT 1
);
```

### Изменения в `users`

```sql
ALTER TABLE users ADD COLUMN best_survival_score REAL NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN best_survival_streak INTEGER NOT NULL DEFAULT 0;
```

## API

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/survival/config` | Конфигурация режима |
| POST | `/api/survival/start` | Начало игры, первый вопрос |
| POST | `/api/survival/answer` | Проверка ответа, следующий вопрос |
| POST | `/api/survival/finish` | Принудительное завершение |
| GET | `/api/survival/leaderboard` | Таблица лидеров |

## In-Memory сессия

```typescript
interface SurvivalSession {
  sessionId: string
  userId: number
  topicIds: number[]
  lives: number
  streak: number
  maxStreak: number
  score: number
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  timeLimitSeconds: number
  difficulty: 'easy' | 'medium' | 'hard'
  questions: SurvivalQuestionRecord[]
  askedQuestionIds: Set<number>
  createdAt: number
  lastActivity: number
}
```

Очистка каждые 60 секунд для сессий неактивных > 5 минут.

## Логика подбора вопросов

```typescript
function getDifficulty(streak: number): 'easy' | 'medium' | 'hard' {
  if (streak < 10) return 'easy'
  if (streak < 25) return 'medium'
  return 'hard'
}

function getTimeLimit(streak: number): number {
  const base = 30
  const decrease = streak * 0.5
  return Math.max(5, base - decrease)
}
```

## Фронтенд

| Компонент | Назначение |
|-----------|------------|
| `SurvivalSetup` | Стартовый экран: выбор тем, рекорды |
| `SurvivalBoard` | Игровой экран: жизни, стрик, таймер, вопрос |
| `SurvivalResults` | Результаты: статистика, рекорды |
| `SurvivalLeaderboard` | Таблица лидеров (все/неделя/день) |

## Реализованные файлы

**Бэкенд:**
- `packages/backend/src/db/schema.ts` — таблицы + alter users
- `packages/backend/src/modules/survival/survival.session.ts`
- `packages/backend/src/modules/survival/survival.service.ts`
- `packages/backend/src/modules/survival/survival.routes.ts`
- `packages/backend/src/app.ts` — `/api/survival`
- `packages/backend/src/index.ts` — cleanup + register
- `packages/backend/src/modules/auth/auth.types.ts` — поля

**Фронтенд:**
- `packages/frontend/src/lib/api.ts` — API-клиент
- `packages/frontend/src/components/organisms/SurvivalSetup/`
- `packages/frontend/src/components/organisms/SurvivalBoard/`
- `packages/frontend/src/components/organisms/SurvivalResults/`
- `packages/frontend/src/routes/survival.tsx`
- `packages/frontend/src/router.tsx`
- `packages/frontend/src/lib/navItems.ts`
- `packages/frontend/src/components/organisms/Sidebar/Sidebar.tsx`
