# Синхронизация форм конфигурации под выбором тем

> ✅ **Статус: Реализовано** (2026-07-07)

---

## Аудит: что под выбором тем

После `TopicList` каждый режим показывает абсолютно разные формы. Нет общего порядка элементов, нет общей карточки конфигурации.

### Текущее состояние (сверху вниз)

| Порядок | Соло | Выживание | Блиц | PvP |
|---------|------|----------|------|-----|
| 1 | — | **Rules** (5 иконок) | — | — |
| 2 | — | **Records** (счёт+стрик) | — | — |
| 3 | — | TopicList | — | — |
| 4 | **TopicList** | — | **TopicList** | **TopicList** |
| 5 | «Время»: 2×TimeSettingRow + Divider «или» | — | «Формат»: 2×Select | Config: 2×Select |
| 6 | «Вопросы»: Select + Checkbox + selectedInfo | — | Powerup-селектор | Checkbox «строгие темы» |
| 7 | — | — | — | Powerup-селектор |
| 8 | Button | Button + Link | Button | Button |

### Основные проблемы

1. **Порядок разный.** Survival: Rules → TopicList. Остальные: TopicList → Config. Нет единой схемы.
2. **Rules только в Survival.** У каждого режима есть механика, которую стоит описать так же компактно.
3. **Records только в Survival.** Соло и PvP тоже могли бы показывать рекорды/рейтинг.
4. **Конфигурация визуально разная.** Соло — секции с h2, радио-таймеры, Divider. Блиц/PvP — плоские Select. Визуально не похожи.
5. **Powerup-селекторы дублируются.** В Blitz и PvP одинаковый JSX, но разный. Нет общей молекулы.

---

## Целевой шаблон

У всех 4 режимов должен быть одинаковый порядок:

```
┌─ HERO ──────────────────────────────────────────┐
│  [icon] Заголовок                                │
│  Краткое описание                                │
└──────────────────────────────────────────────────┘

┌─ TOPICLIST ──────────────────────────────────────┐
│  Выбор тем                                       │
└──────────────────────────────────────────────────┘

┌─ CONFIG CARD ────────────────────────────────────┐
│  ┌─ Rules (сворачиваемый блок) ──────────────┐  │
│  │  ♥ Начало: 3 жизни, 30 сек                │  │
│  │  ⏱ Время убывает...                       │  │
│  │  🔥 Стрик даёт множитель...               │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─ Records (если есть) ─────────────────────┐  │
│  │  🏆 Рекорд: 156 очков  🔥 Стрик: 42       │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─ Settings ─────────────────────────────────┐  │
│  │  [mode-specific Select / Checkbox / Radio] │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘

┌─ POWERUPS (если есть в инвентаре) ───────────────┐
│  Выбор до 3 power-ups на матч                    │
└──────────────────────────────────────────────────┘

┌─ ACTION ─────────────────────────────────────────┐
│  [Button]  [Link к лидерборду]                   │
└──────────────────────────────────────────────────┘
```

Порядок для **всех** режимов:
```
Hero → TopicList → ConfigCard(Rules + Records + Settings) → Powerups → Button
```

---

## Что создать

### 1. Молекула `Rules` — сворачиваемый блок правил

Общая компонента для всех 4 режимов. Принимает массив строк с иконками, показывается компактно, раскрывается по клику.

```typescript
// molecules/Rules/Rules.tsx
interface RulesProps {
  items: { icon: string; text: string }[]
}
```

Использование в каждом режиме:
- **Соло**: 4 правила (очки за скорость, стрик, время, выбор тем)
- **Выживание**: текущие 5 правил (жизни, время, стрик, доп.жизни, сложность)
- **Блиц**: 3 правила (один вопрос на двоих, один ответ на раунд, best-of-N)
- **PvP**: 3 правила (общие вопросы, одновременные ответы, ELO-рейтинг)

### 2. Молекула `ConfigCard` — карточка конфигурации

Единая обёртка для конфигурационной секции. Принимает children, даёт общий фон, радиус, отступы.

```typescript
// molecules/ConfigCard/ConfigCard.tsx
interface ConfigCardProps {
  children: ReactNode
}
```

Визуально: `background: #EDEBD2; border-radius: 8px; padding: 16px; margin-bottom: 16px;`

### 3. Молекула `PowerupSelector` — выбор power-ups на матч

Вынести дублирующийся код из Blitz и PvP в общую молекулу.

```typescript
// molecules/PowerupSelector/PowerupSelector.tsx
interface PowerupSelectorProps {
  types: PowerupType[]
  selected: string[]
  onChange: (ids: string[]) => void
  max?: number  // default 3
}
```

### 4. Молекула `Records` — блок рекордов (опционально)

```typescript
// molecules/Records/Records.tsx
interface RecordsProps {
  items: { label: string; value: string | number }[]
}
```

---

## Режим-специфичные Settings внутри ConfigCard

### Соло
```
[Select: количество вопросов]  [Checkbox: только новые]
[TimeSettingRow: на вопрос]
[Divider: или]
[TimeSettingRow: на игру]
```

### Выживание
```
(настроек нет — всё определено правилами)
```

### Блиц
```
[Select: до N побед]  [Select: секунд на раунд]
```

### PvP
```
[Select: вопросов]  [Select: таймаут]
[Checkbox: строгие темы]
```

---

## Изменения в существующих файлах

| Файл | Что изменить |
|------|-------------|
| `molecules/Rules/` | **Создать** |
| `molecules/ConfigCard/` | **Создать** |
| `molecules/PowerupSelector/` | **Создать** |
| `organisms/NewGameForm/` | Обернуть в ConfigCard, добавить Rules, убрать секционные h2 |
| `organisms/SurvivalSetup/` | Перенести Rules после TopicList, обернуть в ConfigCard, добавить Records |
| `organisms/Blitz/` | Обернуть в ConfigCard, заменить powerup-селектор, добавить Rules |
| `organisms/PvP/` | Обернуть в ConfigCard, заменить powerup-селектор, добавить Rules |

---

## Порядок выполнения

```
1. Создать Rules molecule
2. Создать ConfigCard molecule
3. Создать PowerupSelector molecule
4. Соло: Rules + ConfigCard
5. Выживание: Rules → после TopicList + ConfigCard
6. Блиц: Rules + ConfigCard + PowerupSelector
7. PvP: Rules + ConfigCard + PowerupSelector
8. Проверка сборки
```
