# Расширенная статистика профиля (#06)

## Цель
Страница профиля пользователя (`/users/:login`) должна показывать детальную статистику по всем игровым режимам, разбивку по форматам и простые визуализации.

## Что будет сделано

### Бэкенд (`packages/backend/src/modules/users/users.routes.ts`)
- **`getStats()`** — расширить агрегацию:
  - `totalGames` — сумма игр во всех режимах
  - `solo` — `{ gamesPlayed, totalQuestions, totalCorrect, accuracy, avgScore, totalScore }`
  - `pvp` — `{ gamesPlayed, wins, losses, draws, rating }`
  - `blitz` — `{ gamesPlayed, wins, losses, draws, rating }`
  - `survival` — `{ gamesPlayed, bestScore, bestStreak, avgScore, totalQuestions, totalCorrect }`
  - `questionsAuthored` — существующее
  - `gamesByFormat` — массив `{ format, count, icon }` для круговой диаграммы
  - `recent` — последние игры **всех** форматов (не только solo)

### Фронтенд (типы)
- `api.ts`: обновить `UserProfileData.stats` под новую структуру

### Фронтенд (компонент)
- **`UserProfile.tsx`** — переписать правую панель:
  - Секция «Общая статистика»: всего игр, всего вопросов, общая точность
  - Карточки по форматам: Solo, PvP, Blitz, Survival — иконка, кол-во игр, win/loss, рейтинг
  - Простая визуализация разбивки по форматам (CSS bars / donut)
- **`UserProfile.module.scss`** — стили для новых блоков

## Используемые таблицы БД
- `game_results` — solo-игры
- `pvp_games` — PvP-игры
- `blitz_games` — Blitz-игры
- `survival_games` — Survival-игры
- `elo_ratings` — PvP рейтинг
- `blitz_ratings` — Blitz рейтинг
- `users` — базовые поля (score, best_survival_score, best_survival_streak)
