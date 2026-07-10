# 2. «Блиц-дуэль» (Speed Duel)

> ✅ **Статус: Реализовано** (2026-07-06)

---

## Концепция

Два игрока видят один вопрос одновременно. Кто первый нажал правильный ответ — забирает раунд. Best of 5/7/9. Pure speed + knowledge. Время партии ~2 минуты.

## Ключевые параметры

| Параметр | Значение |
|----------|----------|
| Длительность матча | Best of 5, 7 или 9 (выбирается игроком) |
| Время на раунд | 10, 15 или 20 сек (выбирается игроком) |
| Попыток на раунд | **1 на игрока** |
| Неверный ответ | Игрок блокируется до конца раунда |
| Ничья в раунде | Оба не ответили / оба ошиблись — ничья, не засчитывается |
| Победа в матче | Первый, кто выиграл > N/2 раундов |
| ELO | Отдельный `blitz_ratings` (K=32) |

## Схема стейт-машины

```
        ┌──────────┐
        │  QUEUE   │  Выбор тем, кол-ва раундов, времени
        └────┬─────┘
             │ матч найден
             ▼
        ┌──────────┐
        │COUNTDOWN │  3 сек перед началом
        └────┬─────┘
             ▼
        ┌──────────┐    ┌──────────────────────────┐
   ┌───►│  ROUND   │───►│ P1 correct → P1 wins     │
   │    │ QUESTION │    │ P2 correct → P2 wins     │
   │    └────┬─────┘    │ P1 wrong → P1 locked out │
   │         │          │ P2 wrong → P2 locked out │
   │         │          │ Both locked out → DRAW   │
   │         │          │ Timer expires → DRAW     │
   │         │          └──────────────────────────┘
   │    ┌────▼─────┐
   │    │ROUND END │  Показ результата (1.5 сек)
   │    └────┬─────┘
   │         │
   │    ┌────▼──────┐
   │    │won > N/2? │──нет──► ROUND
   │    └────┬──────┘
   │         │ да
   │         ▼
   │    ┌──────────┐
   │    │GAME OVER │  Результаты, ELO
   │    └──────────┘
   │
   └──── дисконнект → противник побеждает (15 сек grace)
```

## Структура БД

### Таблица `blitz_games`

```sql
CREATE TABLE blitz_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player1_id INTEGER NOT NULL REFERENCES users(id),
  player2_id INTEGER NOT NULL REFERENCES users(id),
  winner_id INTEGER REFERENCES users(id),
  topic_ids TEXT NOT NULL,
  round_count INTEGER NOT NULL,
  time_per_round INTEGER NOT NULL,
  score_p1 INTEGER NOT NULL DEFAULT 0,
  score_p2 INTEGER NOT NULL DEFAULT 0,
  elo_change_p1 INTEGER NOT NULL DEFAULT 0,
  elo_change_p2 INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Таблица `blitz_game_rounds`

```sql
CREATE TABLE blitz_game_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL REFERENCES blitz_games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  winner_id INTEGER REFERENCES users(id),
  p1_answer TEXT,
  p1_correct INTEGER,
  p1_time_cs INTEGER,
  p2_answer TEXT,
  p2_correct INTEGER,
  p2_time_cs INTEGER
);
```

### Таблица `blitz_ratings`

```sql
CREATE TABLE blitz_ratings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL DEFAULT 1000,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0
);
```

## Socket.io протокол

Неймспейс: отдельный путь `/blitz-socket` (аналогично `/pvp-socket`).

### Client → Server

| Событие | Данные | Описание |
|---------|--------|----------|
| `blitz:join` | `{ topicIds, roundCount, timePerRound }` | Встать в очередь |
| `blitz:cancel` | `{}` | Выйти из очереди |
| `blitz:answer` | `{ answer, timeCs }` | Ответ на текущий раунд |

### Server → Client

| Событие | Данные | Описание |
|---------|--------|----------|
| `blitz:waiting` | `{}` | В очереди |
| `blitz:cancelled` | `{}` | Вышел из очереди |
| `blitz:match-found` | `{ opponent, roundCount, timePerRound }` | Матч найден |
| `blitz:countdown` | `{ seconds }` | Обратный отсчёт 3-2-1 |
| `blitz:round-start` | `{ roundNumber, question, scores }` | Новый раунд |
| `blitz:opponent-answered` | `{}` | Соперник ответил |
| `blitz:round-result` | `{ roundNumber, winnerId, p1, p2, scores }` | Итог раунда |
| `blitz:game-result` | `{ winnerId, scores, eloChanges, rounds }` | Итог матча |
| `blitz:opponent-disconnected` | `{}` | Соперник отключился |
| `blitz:opponent-reconnected` | `{}` | Соперник вернулся |

## Логика раунда

1. Сервер выбирает случайный вопрос из выбранных тем
2. Отправляет `blitz:round-start` обоим игрокам
3. Запускает таймер на `timePerRound` секунд
4. Игроки отправляют `blitz:answer`
5. **Первый правильный ответ** → раунд выигран этим игроком
6. **Неверный ответ** → игрок помечается `lockedOut`, его дальнейшие ответы игнорируются
7. **Оба lockedOut** или **таймер истёк** → ничья в раунде
8. Отправляется `blitz:round-result`, через 1.5 сек — следующий раунд

## ELO для блиц-режима

Отдельная таблица `blitz_ratings`, стандартный ELO с K=32.

```typescript
function calcElo(ratingA: number, ratingB: number, scoreA: number): {
  newA: number; newB: number; changeA: number; changeB: number
}
// scoreA = 1 (победа p1), 0 (поражение p1), 0.5 (ничья)
```

## In-Memory структуры

```typescript
interface BlitzQueueEntry {
  userId: number
  login: string
  nickname: string
  rating: number
  topicIds: number[]
  roundCount: number
  timePerRound: number
  joinedAt: number
}

interface BlitzGame {
  id: number
  player1: BlitzPlayerState
  player2: BlitzPlayerState
  topicIds: number[]
  roundCount: number
  timePerRound: number
  currentRound: number
  rounds: BlitzRoundResult[]
  disconnectTimer1: ReturnType<typeof setTimeout> | null
  disconnectTimer2: ReturnType<typeof setTimeout> | null
}

interface BlitzPlayerState {
  userId: number
  login: string
  nickname: string
  rating: number
  roundsWon: number
  lockedOut: boolean        // для текущего раунда
  answeredThisRound: boolean
}

interface BlitzRoundResult {
  roundNumber: number
  questionId: number
  questionText: string
  answers: string[]
  correctIndex: number
  winnerId: number | null
  p1Answer: string | null
  p1Correct: boolean | null
  p1TimeCs: number | null
  p2Answer: string | null
  p2Correct: boolean | null
  p2TimeCs: number | null
}
```

## Фронтенд

| Компонент | Назначение |
|-----------|------------|
| `BlitzSetup` | Лобби: выбор тем, кол-ва раундов, времени |
| `BlitzBoard` | Игровой экран: вопрос, таймер, счёт, статус соперника |
| `BlitzResults` | Результаты матча: счёт по раундам, ELO |
| `BlitzRatings` | Таблица рейтинга блиц-дуэлей |

### Роутинг

- `/blitz` — BlitzSetup / BlitzBoard / BlitzResults
- `/blitz/ratings` — BlitzRatings

### Socket-клиент

Отдельный файл `lib/blitz-socket.ts`, аналогично `lib/pvp-socket.ts`.

## Файлы для реализации

**Бэкенд:**
- `packages/backend/src/modules/blitz/blitz.types.ts`
- `packages/backend/src/modules/blitz/blitz.elo.ts`
- `packages/backend/src/modules/blitz/blitz.lobby.ts`
- `packages/backend/src/modules/blitz/blitz.engine.ts`
- `packages/backend/src/modules/blitz/blitz.socket.ts`
- `packages/backend/src/modules/blitz/blitz.routes.ts`

**Фронтенд:**
- `packages/frontend/src/lib/blitz-socket.ts`
- `packages/frontend/src/components/organisms/Blitz/Blitz.tsx`
- `packages/frontend/src/routes/blitz.tsx`

**Изменения:**
- `packages/backend/src/db/schema.ts` — 3 таблицы
- `packages/backend/src/app.ts` — `/api/blitz`
- `packages/backend/src/index.ts` — socket server
- `packages/frontend/src/lib/api.ts` — API-клиент
- `packages/frontend/src/router.tsx` — маршруты
- `packages/frontend/src/lib/navItems.ts` — навигация
- `packages/frontend/src/components/organisms/Sidebar/Sidebar.tsx`
