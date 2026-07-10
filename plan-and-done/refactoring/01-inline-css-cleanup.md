# Чистка inline-CSS и параметризация компонентов

> ✅ **Статус: Реализовано** (2026-07-07)

---

## Аудит

Сканирование выявило **55 файлов** с `style={{` и **172** вхождения инлайн-стилей в `components/` и `routes/`.

Без учёта fixture-файлов Cosmos (~33 файла, ~100 вхождений), в production-коде **20 файлов, ~80 вхождений**.

### Топ production-файлов по количеству инлайн-стилей

| Файл | Count | Основные паттерны |
|------|-------|------------------|
| `organisms/AddQuestions/AddQuestions.tsx` | 17 | flex-контейнеры, message-box, card preview |
| `organisms/PvP/PvP.tsx` | 8 | отступы, цвет текста, flex |
| `ErrorBoundary.tsx` | 7 | layout full-page |
| `organisms/NewQuestionForm/NewQuestionForm.tsx` | 6 | flex-строка ответа |
| `organisms/AuthForm/AuthForm.tsx` | 5 | индикатор сложности пароля |
| `organisms/GameBoard/GameBoard.tsx` | 5 | индикаторы powerup'ов, отступы |
| `routes/users.tsx` | 5 | центрированные контейнеры-заглушки |
| `routes/not-found.tsx` | 5 | параллакс, текст |
| `routes/auth.tsx` | 5 | центровка, отступы |
| `organisms/SurvivalBoard/SurvivalBoard.tsx` | 3 | индикаторы powerup'ов |
| `routes/survival.tsx` | 3 | отступы |
| `routes/game.tsx` | 3 | центровка |
| `organisms/TopicList/TopicList.tsx` | 2 | позиционирование модала |
| `routes/misc.tsx` | 1 | центровка |
| `atoms/Overlay/Overlay.tsx` | 1 | позиционирование |
| `organisms/UsersPage/UsersPage.tsx` | 1 | центровка |
| `organisms/AdminPage/AdminPage.tsx` | 1 | отступ |
| `atoms/Spinner/Spinner.tsx` | 1 | выравнивание |
| `atoms/Tooltip/Tooltip.tsx` | 1 | тень |

---

## План: что создаём / меняем

Работы разбиты на 4 итерации по приоритету (воздействие / трудоёмкость).

---

### Итерация 1: Layout-атомы (наибольший эффект)

Эти компоненты уберут ~40% всех инлайн-стилей одним ударом.

#### 1a. Новый атом: `<Flex>`

Самый повторяемый паттерн в проекте.

```typescript
// atoms/Flex/Flex.tsx
interface FlexProps {
  children: ReactNode
  gap?: number | string        // gap in px or CSS value
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  direction?: 'row' | 'column'
  className?: string           // прокидывание внешнего className
  style?: CSSProperties        // только для крайних случаев
}
```

Преобразование (было → стало):
```tsx
// Было
<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
  {items}
</div>

// Стало
<Flex gap={8} wrap align="center">
  {items}
</Flex>
```

**Затрагивает:** AddQuestions, NewQuestionForm, PvP, GameBoard, SurvivalBoard, ErrorBoundary, TopicList, все routes, все fixtures (30+ файлов).

**Элиминирует:** ~35 инлайн-стилей.

#### 1b. Новый атом: `<Text>`

Типографика — единообразие через варианты.

```typescript
// atoms/Text/Text.tsx
interface TextProps {
  children: ReactNode
  variant?: 'body' | 'muted' | 'error' | 'success' | 'accent' | 'heading'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  center?: boolean
  className?: string
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3'
}
```

Цвета из `_variables.scss`:
- `muted` → `#5A7184` (серый)
- `error` → `#CC3A3A` (красный)
- `success` → `#2D7A4F` (зелёный)
- `accent` → `#F9A253` (оранжевый)
- `body` → `#182C3F` (тёмный)

Размеры:
- `sm` → 12px, `md` → 14px, `lg` → 17px, `xl` → 24px

**Затрагивает:** PvP, routes/auth, routes/users, routes/misc, AddQuestions, AdminPage, ErrorBoundary.

**Элиминирует:** ~15 инлайн-стилей.

#### 1c. Новый атом: `<Center>`

Оборачивает контент в центрированный контейнер с отступом.

```typescript
// atoms/Center/Center.tsx
interface CenterProps {
  children: ReactNode
  padding?: number          // padding в px, default 40
  maxWidth?: number         // default нет ограничения
}
```

```tsx
// Было
<div style={{ textAlign: 'center', padding: 60 }}><Spinner /><p>Нет вопросов</p></div>

// Стало
<Center padding={60}><Spinner /><p>Нет вопросов</p></Center>
```

**Затрагивает:** routes/game, routes/users, routes/misc, routes/survival, routes/auth.

**Элиминирует:** ~12 инлайн-стилей.

---

### Итерация 2: Молекулы из повторяющихся шаблонов

#### 2a. Новая молекула: `<Message>` / `<Alert>`

Бокс сообщения с вариантами success / error / info.

```typescript
// molecules/Message/Message.tsx
interface MessageProps {
  children: ReactNode
  variant: 'success' | 'error' | 'info' | 'warning'
}
```

```tsx
// Было
<div style={{ marginTop: 12, padding: 8, borderRadius: 4, fontSize: 12, color: '#37CE74', border: '1px solid #37CE74', background: 'rgba(55,206,116,0.1)' }}>
  Вопрос добавлен!
</div>

// Стало
<Message variant="success">Вопрос добавлен!</Message>
```

**Затрагивает:** AddQuestions (2 message box'а).

**Элиминирует:** ~6 инлайн-стилей.

#### 2b. Новая молекула: `<StrengthBar>`

Индикатор сложности пароля (из `AuthForm`).

```typescript
// molecules/StrengthBar/StrengthBar.tsx
interface StrengthBarProps {
  strength: number  // 0–4 (результат zxcvbn)
}
```

Визуализация: 4 сегмента, цвет от красного до зелёного, подпись «Слабый»–«Надёжный».

**Затрагивает:** AuthForm (2 экземпляра: регистрация + сброс пароля).

**Элиминирует:** ~4 инлайн-стилей.

#### 2c. Новая молекула: `<AnswerRow>`

Строка редактирования ответа (номер + input + кнопка удаления).

```typescript
// molecules/AnswerRow/AnswerRow.tsx
interface AnswerRowProps {
  index: number
  value: string
  onChange: (value: string) => void
  onRemove?: () => void
  placeholder?: string
}
```

**Затрагивает:** NewQuestionForm (4 идентичных строки ответов).

**Элиминирует:** ~6 инлайн-стилей.

---

### Итерация 3: Расширение существующих атомов

#### 3a. `Button` — прокидывание `className`

Добавить проп `className` в `Button`, чтобы внешние отступы можно было задавать через SCSS, а не `style={{ marginTop: ... }}`.

**Затрагивает:** PvP, SurvivalBoard, routes.

**Элиминирует:** ~5 инлайн-стилей.

#### 3b. `Timer` — настройка размера

Добавить проп `size?: 'sm' | 'md' | 'lg'` для управления размером цифр таймера.

**Затрагивает:** (предотвращает будущие инлайн-стили).

#### 3c. `AnswerGrid` — поддержка скрытых индексов

Добавить проп `hiddenIndices?: number[]` для фильтрации скрытых ответов (вместо внешней фильтрации в GameBoard/SurvivalBoard).

**Затрагивает:** GameBoard, SurvivalBoard.

**Элиминирует:** ~4 инлайн-стилей (логика фильтрации переезжает внутрь).

---

### Итерация 4: Добивка оставшихся

#### 4a. `ErrorBoundary` → `organisms/ErrorFallback`

Вынести в отдельный компонент с SCSS-модулем.

**Элиминирует:** 7 инлайн-стилей.

#### 4b. TopicList — модальный режим

Кнопка «закрыть» с абсолютным позиционированием — заменить на фиксированные классы.

**Элиминирует:** 2 инлайн-стиля.

#### 4c. Spinner — выравнивание

Добавить проп `center?: boolean` для автоматического центрирования.

**Элиминирует:** 1 инлайн-стиль.

#### 4d. Overlay — позиционирование

Добавить SCSS-модуль (сейчас инлайн).

**Элиминирует:** 1 инлайн-стиль.

---

## Сводная таблица

| Итерация | Что | Файлов затронуто | Инлайн-стилей устранено | Оценка сложности |
|----------|-----|------------------|------------------------|------------------|
| 1 | Flex, Text, Center — layout-атомы | 30+ | ~62 | 3–4 часа |
| 2 | Message, StrengthBar, AnswerRow — молекулы | 3 | ~16 | 2–3 часа |
| 3 | Расширение Button, Timer, AnswerGrid | 5 | ~9 | 1–2 часа |
| 4 | ErrorFallback, Spinner, Overlay, TopicList | 4 | ~11 | 1–2 часа |
| **Итого** | | **~40** | **~98** | **7–11 часов** |

---

## Принцип: где живёт стиль

| Тип элемента | Где задаётся стиль |
|-------------|-------------------|
| Layout-примитивы (flex, grid, stack) | Атомы: `<Flex>`, `<Center>`, `<Grid>` |
| Типографика (шрифт, цвет, размер) | Атом: `<Text>` или SCSS-модуль компонента |
| Повторяющиеся UI-паттерны | Молекулы: `<Message>`, `<StrengthBar>`, `<AnswerRow>` |
| Уникальная стилизация компонента | SCSS-модуль компонента (`.module.scss`) |
| Внешние отступы (margin) | SCSS-класс родительского контейнера |
| Дефолтное состояние атома | Пропы с вариантами (`variant`, `size`) |
| Инлайн-стиль | **Только динамические значения, невыразимые через пропы** (например, цвет из рантайм-данных) |

---

## Порядок выполнения

```
1a. Flex           ← начинать отсюда
1b. Text
1c. Center
2a. Message
2b. StrengthBar
2c. AnswerRow
3a. Button className
3c. AnswerGrid hiddenIndices
4a. ErrorFallback
4bcd. Spinner, Overlay, TopicList
Замена во всех затронутых файлах
Удаление старых инлайн-стилей
```

---

## Пример: AddQuestions до и после

**До** (17 инлайн-стилей):
```tsx
<div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
  <div style={{ flex: 1 }}>
    <Select ... />
  </div>
  <div style={{ flex: 1 }}>
    <Select ... />
  </div>
</div>

{message && (
  <div style={{ marginTop: 12, padding: 8, borderRadius: 4, fontSize: 12,
    color: messageType === 'success' ? '#37CE74' : '#FF0000',
    border: `1px solid ${messageType === 'success' ? '#37CE74' : '#FF0000'}`,
    background: messageType === 'success' ? 'rgba(55,206,116,0.1)' : 'rgba(255,0,0,0.05)' }}>
    {message}
  </div>
)}

<div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
  ...
</div>
```

**После** (0 инлайн-стилей):
```tsx
<Flex gap={12} className={styles.formRow}>
  <div className={styles.formCol}><Select ... /></div>
  <div className={styles.formCol}><Select ... /></div>
</Flex>

{message && <Message variant={messageType}>{message}</Message>}

<Flex gap={8} align="center" className={styles.previewRow}>
  ...
</Flex>
```
