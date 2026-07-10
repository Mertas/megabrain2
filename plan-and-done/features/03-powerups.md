# 3. Power-ups (Усиления)

> ✅ **Статус: Фаза 1 реализована** (2026-07-06)

---

## Концепция

Power-ups — это стратегический слой поверх всех игровых режимов. Игроки собирают коллекцию усилений, выбирают «боевой набор» перед матчем и активируют их в критические моменты игры. В PvP и Blitz power-ups становятся центральной механикой — они видны сопернику, их можно отражать, и они создают моменты перелома.

Power-ups **не pay-to-win**: они зарабатываются игрой, а не покупаются за реальные деньги. Максимум 3 power-up'а на игру. Каждый power-up можно использовать **один раз за матч**.

---

## Типы power-ups

### Категория: Offensive (PvP / Blitz)

Эти power-ups направлены на соперника. При активации соперник получает уведомление и может среагировать (использовать Reflect, если есть).

| ID | Название | Эффект | Стоимость | Режимы |
|----|----------|--------|-----------|--------|
| `freeze` | ❄️ Заморозка | Соперник теряет **5 сек** на текущем вопросе (PvP) или текущем раунде (Blitz) | 80 | PvP, Blitz |
| `sabotage` | 💣 Саботаж | Ответ соперника задерживается на **2 сек** (сервер принимает, но обрабатывает с задержкой) | 120 | Blitz |
| `blind` | 🕶️ Ослепление | Соперник не видит свой таймер в течение **5 сек** | 90 | PvP |
| `steal-time` | ⏱ Кража времени | Если вы ответили верно, у соперника −3 сек на следующий вопрос/раунд | 100 | PvP, Blitz |

### Категория: Defensive

Защищают игрока от ошибок или атак соперника.

| ID | Название | Эффект | Стоимость | Режимы |
|----|----------|--------|-----------|--------|
| `shield` | 🛡 Щит | Одна ошибка не засчитывается: жизнь не теряется, очки не вычитаются | 80 | Все |
| `reflect` | 🔮 Отражение | Отражает **один** offensive power-up соперника обратно на него | 130 | PvP, Blitz |
| `streak-saver` | 🔥 Сохранение стрика | При ошибке стрик падает наполовину (round down), а не в ноль | 120 | Соло, Survival |
| `immunity` | ⭐ Иммунитет | Иммунитет ко всем offensive power-ups соперника на **один вопрос/раунд** | 150 | PvP, Blitz |

### Категория: Utility

Универсальные усиления для всех режимов.

| ID | Название | Эффект | Стоимость | Режимы |
|----|----------|--------|-----------|--------|
| `fifty-fifty` | 🎯 50:50 | Убирает 2 неверных ответа (остаётся 2 варианта) | 40 | Все |
| `extra-time` | ⏳ Доп. время | +10 сек на текущий вопрос (соло/выживание) или +5 сек (PvP/Blitz) | 30 | Все |
| `double-points` | ✨ ×2 Очка | Удваивает очки за следующий верный ответ | 50 | Все |
| `skip-safe` | 🔄 Пропуск | Пропустить вопрос без потери стрика или жизни | 40 | Соло, Survival |
| `peek` | 👁 Подсказка | Показывает правильный ответ (очки за вопрос = 0) | 200 | Все |
| `second-chance` | 🔁 Второй шанс | Позволяет ответить ещё раз после ошибки (только 1 доп. попытка) | 60 | Соло, Survival |

### Категория: Global

Влияют на всю игру, а не на один вопрос. Активируются до начала игры.

| ID | Название | Эффект | Стоимость | Режимы |
|----|----------|--------|-----------|--------|
| `score-boost` | 📈 Буст очков | +25% ко всем очкам за игру | 180 | Соло, PvP |
| `head-start` | 🚀 Фора | В Survival: начать с 5 жизней вместо 3 | 250 | Survival |
| `extra-slot` | 🎒 Доп. слот | +1 слот для power-ups в этой игре (макс 4) | 300 | Все |

---

## Механика PvP с power-ups

### Боевой набор (Loadout)

Перед входом в очередь PvP или Blitz игрок выбирает **до 3 power-ups** из своего инвентаря. Это его «боевой набор» на матч. Неиспользованные — возвращаются.

```
┌─────────────────────────────────────────┐
│        ВЫБОР POWER-UPS (0/3)            │
│                                         │
│  Инвентарь:                             │
│  🎯 50:50    ×5  [+ добавить]          │
│  🛡 Щит      ×2  [+ добавить]          │
│  ❄️ Заморозка ×1  [+ добавить]          │
│  ⏱ Кража    ×1  [+ добавить]           │
│  ✨ ×2 Очка  ×3  [+ добавить]          │
│                                         │
│  Выбрано: (пока пусто)                  │
│                                         │
│            [ В ОЧЕРЕДЬ ]               │
└─────────────────────────────────────────┘
```

### Игровой HUD с power-ups

Во время игры в нижней части экрана отображаются выбранные power-ups:

```
┌──────────────────────────────────────────────────┐
│                                                  │
│               Вопрос #5                          │
│               ⏱ 00:12:42                         │
│                                                  │
│  [1] Ответ 1    [2] Ответ 2                     │
│  [3] Ответ 3    [4] Ответ 4                     │
│                                                  │
├──────────────────────────────────────────────────┤
│  🎯50:50  ✨×2   ⏳+10с        Соперник: 🛡     │
│  [ Z ]    [ X ]  [ C ]         ❄️ активен!       │
└──────────────────────────────────────────────────┘
```

- Игрок активирует power-up клавишами **Z, X, C** или кликом
- Когда соперник использует offensive power-up, появляется анимация + возможность нажать **V** для Reflect (если есть в наборе)
- Power-ups соперника **видны в реальном времени**

### Фазы активации

| Фаза | Что можно использовать |
|------|----------------------|
| До игры | Global power-ups (score-boost, head-start) |
| Начало вопроса | Utility, Defensive |
| После ответа соперника | Reflect (реакция на offensive) |
| Середина таймера | Offensive против соперника |

### Визуальные эффекты

- **Offensive на сопернике**: красная вспышка + иконка эффекта над его аватаром
- **Defensive на себе**: зелёный щит + звук активации
- **50:50**: два ответа исчезают с анимацией растворения
- **Reflect**: зеркальная анимация, power-up летит обратно

---

## Как зарабатывать power-ups

| Источник | Сколько | Периодичность |
|----------|---------|---------------|
| Завершение игры (соло/PvP/Blitz) | 1 случайный power-up | Каждая игра |
| Победа в PvP/Blitz | +1 бонусный power-up | Каждая победа |
| Ежедневный вход | 1 случайный power-up | Раз в день |
| Стрик побед (3+ подряд в PvP) | Редкий power-up (Immunity/Reflect) | За каждые 3 |
| Покупка за score | Любой power-up за очки | В любое время |
| Уровень игрока | +5 случайных power-ups | При level-up |
| Survival: каждые 50 верных | 1 случайный power-up | Во время игры |

### Магазин

Игрок может купить power-ups за накопленные очки (`score`) в профиле:

```
┌──────────────────────────────────────────────┐
│  МАГАЗИН POWER-UPS                Счёт: 1 250│
│                                              │
│  🎯 50:50        40 очков    [Купить]        │
│  ❄️ Заморозка    80 очков    [Купить]        │
│  🔮 Отражение   130 очков    [Купить]        │
│  ...                                         │
└──────────────────────────────────────────────┘
```

---

## Структура БД

```sql
-- Типы power-ups (seed-данные)
CREATE TABLE powerup_types (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  category      TEXT NOT NULL CHECK(category IN ('offensive','defensive','utility','global')),
  cost          INTEGER NOT NULL DEFAULT 50,
  max_per_game  INTEGER NOT NULL DEFAULT 1,
  available_in  TEXT NOT NULL DEFAULT 'all',
  icon          TEXT NOT NULL DEFAULT '?'
);

-- Инвентарь игрока
CREATE TABLE user_powerups (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  powerup_id TEXT NOT NULL REFERENCES powerup_types(id),
  quantity   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, powerup_id)
);

-- История использования
CREATE TABLE powerup_usage (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  powerup_id  TEXT NOT NULL,
  game_mode   TEXT NOT NULL,
  game_id     INTEGER,
  used_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## Seed-данные powerup_types

```sql
INSERT INTO powerup_types (id, name, description, category, cost, max_per_game, available_in, icon) VALUES
('fifty-fifty',   '50:50',        'Убирает 2 неверных ответа',                           'utility',   40,  1, 'all',              '🎯'),
('extra-time',    'Доп. время',   '+10 сек на вопрос (+5 в PvP/Blitz)',                  'defensive', 30,  1, 'all',              '⏳'),
('double-points', '×2 Очка',      '×2 очка за следующий верный ответ',                   'utility',   50,  1, 'all',              '✨'),
('skip-safe',     'Пропуск',      'Пропустить вопрос без потери стрика/жизни',           'utility',   40,  1, 'solo,survival',    '🔄'),
('shield',        'Щит',          'Одна ошибка не засчитывается',                        'defensive', 80,  1, 'all',              '🛡'),
('freeze',        'Заморозка',    'Соперник теряет 5 сек на вопросе/раунде',             'offensive', 80,  1, 'pvp,blitz',        '❄️'),
('sabotage',      'Саботаж',      'Ответ соперника обрабатывается с задержкой 2 сек',    'offensive', 120, 1, 'blitz',            '💣'),
('blind',         'Ослепление',   'Соперник не видит таймер 5 сек',                      'offensive', 90,  1, 'pvp',              '🕶️'),
('steal-time',    'Кража времени','При верном ответе: соперник −3 сек на следующий',     'offensive', 100, 1, 'pvp,blitz',        '⏱'),
('reflect',       'Отражение',    'Отражает offensive power-up соперника обратно',        'defensive', 130, 1, 'pvp,blitz',        '🔮'),
('streak-saver',  'Сохр. стрика', 'При ошибке стрик падает наполовину, а не в 0',        'defensive', 120, 1, 'solo,survival',    '🔥'),
('immunity',      'Иммунитет',    'Иммунитет к offensive power-ups на 1 вопрос/раунд',    'defensive', 150, 1, 'pvp,blitz',        '⭐'),
('peek',          'Подсказка',    'Показывает правильный ответ (0 очков за вопрос)',      'utility',   200, 1, 'all',              '👁'),
('second-chance', 'Второй шанс',  'Позволяет ответить ещё раз после ошибки',             'utility',   60,  1, 'solo,survival',    '🔁'),
('score-boost',   'Буст очков',   '+25% ко всем очкам за игру',                          'global',    180, 1, 'solo,pvp',         '📈'),
('head-start',    'Фора',         'Начать Survival с 5 жизнями вместо 3',                 'global',    250, 1, 'survival',         '🚀'),
('extra-slot',    'Доп. слот',    '+1 слот для power-ups в этой игре (макс 4)',          'global',    300, 1, 'all',              '🎒');
```

---

## API

### `GET /api/powerups/types`

Список всех типов power-ups.

### `GET /api/powerups/inventory`

Инвентарь текущего игрока.

**Ответ:**
```json
{
  "inventory": [
    { "powerupId": "fifty-fifty", "quantity": 5 },
    { "powerupId": "freeze", "quantity": 2 }
  ],
  "totalScore": 1250
}
```

### `POST /api/powerups/buy`

Купить power-up за очки.

```json
{ "powerupId": "freeze", "quantity": 1 }
```

### `POST /api/powerups/use`

Использовать power-up во время игры (серверная валидация).

```json
{
  "powerupId": "fifty-fifty",
  "gameMode": "solo",
  "gameId": null,
  "questionId": 42
}
```

**Ответ:**
```json
{
  "ok": true,
  "effect": {
    "type": "fifty-fifty",
    "removedIndices": [1, 3]
  },
  "remaining": 4
}
```

### `GET /api/powerups/history`

История использования (для профиля).

---

## Websocket-события для PvP/Blitz power-ups

### Client → Server

| Событие | Данные |
|---------|--------|
| `pvp:use-powerup` | `{ powerupId, questionIndex }` |
| `blitz:use-powerup` | `{ powerupId }` |

### Server → Client

| Событие | Данные |
|---------|--------|
| `pvp:powerup-used` (себе) | `{ powerupId, effect }` |
| `pvp:powerup-used` (сопернику) | `{ powerupId, effect }` (только для offensive) |
| `pvp:powerup-reflected` | `{ powerupId }` |

Для Reflect:
1. Игрок A использует Freeze против игрока B
2. Сервер отправляет `powerup-used` игроку B с 1-секундным окном для Reflect
3. Если B использует Reflect в течение окна → Freeze возвращается к A
4. Иначе Freeze применяется к B

---

## Интеграция с игровыми режимами

### Соло-игра

- В `NewGameForm` — выбор до 3 power-ups
- В `GameBoard` — кнопки Z/X/C или панель снизу
- `check-answer` API расширяется полем `activePowerups`
- `submit-result` API проверяет легальность использования

### PvP

- В PvP-лобби — выбор loadout (0-3 слота)
- События `pvp:use-powerup` по WebSocket
- Сервер проверяет инвентарь и валидность
- Offensive power-ups применяются с окном Reflect

### Blitz

- Аналогично PvP, но с учётом раундовой механики
- Некоторые power-ups имеют изменённые эффекты (extra-time даёт +5 сек вместо +10)
- Sabotage доступен только в Blitz

### Survival

- Power-ups используются из инвентаря внутри игры
- `survival/answer` эндпоинт расширяется полем `activePowerup`
- Head-start активируется до начала (на экране SurvivalSetup)

---

## Баланс

| Принцип | Правило |
|---------|---------|
| Максимум power-ups на игру | **3** (4 с extra-slot) |
| Каждый power-up используется | **1 раз за матч** |
| Offensive окно Reflect | **1 сек** после получения |
| Стоимость растёт с редкостью | 30–300 очков |
| Ежедневный бонус | 1 случайный (не даёт peek/immunity) |
| Power-ups не накапливаются бесконечно | Макс. **20 шт** каждого типа |
| Нельзя использовать два offensive одновременно | Кулдаун **3 сек** между power-ups |

---

## UI-элементы

| Компонент | Назначение |
|-----------|------------|
| `PowerupShop` | Магазин в профиле / отдельная страница |
| `PowerupLoadout` | Выбор боевого набора перед PvP/Blitz |
| `PowerupBar` | Игровая панель (Z/X/C) с иконками |
| `PowerupNotification` | Всплывашка при активации соперником |
| `PowerupReflectOverlay` | Окно «Нажми V для отражения» |
| `PowerupInventory` | Инвентарь в профиле |

---

## Этапы реализации

### Фаза 1: Ядро (соло + Survival)
- [ ] Таблицы `powerup_types`, `user_powerups`, `powerup_usage`
- [ ] Seed powerup_types
- [ ] API: `types`, `inventory`, `buy`
- [ ] `PowerupShop` + `PowerupInventory`
- [ ] Интеграция с `GameBoard` (fifty-fifty, extra-time, double-points)
- [ ] Интеграция с `SurvivalBoard` (shield, skip-safe, streak-saver, head-start)

### Фаза 2: PvP + Blitz
- [ ] `PowerupLoadout` перед матчем
- [ ] `PowerupBar` в PvP-интерфейсе
- [ ] WebSocket события `pvp:use-powerup`, `blitz:use-powerup`
- [ ] Offensive power-ups: freeze, blind, steal-time, sabotage
- [ ] Reflect-механика с окном реакции
- [ ] Серверная валидация

### Фаза 3: Экономика
- [ ] Начисление power-ups за игры
- [ ] Ежедневный бонус
- [ ] Бонусы за стрик побед и level-up
- [ ] Лимиты накопления

### Фаза 4: Полировка
- [ ] Анимации и звуки
- [ ] Балансировка стоимости
- [ ] Статистика использования в профиле
