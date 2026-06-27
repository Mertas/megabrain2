# Megabrain2 — План разработки

Анализ legacy-проекта: `megabrain.ru` (2011) — платформа викторин/тестов с темами, таймером, PvP и рейтингами. Цель: полная переработка в современное SPA с собственным бэкендом.

---

## Архитектура проекта

```
megabrain2/
├── packages/
│   ├── frontend/          # React 19 + Vite + TanStack
│   ├── backend/           # Express + TypeScript + SQLite
│   └── shared/            # Общие типы TypeScript
├── package.json           # Монорепозиторий (npm workspaces / turborepo)
└── PLAN.md
```

### Технологический стек

| Слой        | Технология                     |
|------------|-------------------------------|
| Фронтенд    | React 19, TypeScript, Vite    |
| Стейт       | TanStack Store                |
| Роутинг     | TanStack Router (file-based)  |
| Стили       | SCSS (SCSS Modules)           |
| HTTP        | TanStack Query                |
| Бэкенд      | Express + TypeScript          |
| БД          | SQLite (better-sqlite3)       |
| Авторизация | JWT (access + refresh tokens) |

### Структура frontend

```
packages/frontend/
├── src/
│   ├── components/            # Библиотека UI-компонентов (Atomic Design)
│   │   ├── atoms/             # Button, Input, Timer, Badge, Icon...
│   │   ├── molecules/         # SearchForm, AnswerOption, TopicCard...
│   │   ├── organisms/         # GameBoard, TopicList, Header, Sidebar...
│   │   └── templates/         # PageLayout, GameLayout
│   ├── routes/                # TanStack Router (file-based)
│   ├── stores/                # TanStack Store
│   ├── queries/               # TanStack Query hooks
│   ├── mocks/                 # Mock-данные (MSW + fixtures)
│   ├── styles/                # Глобальные SCSS, переменные, миксины
│   └── lib/                   # Утилиты, API-клиент
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Роутинг и страницы (на основе legacy)

| Маршрут              | Страница                     | Legacy-файл       |
|----------------------|------------------------------|-------------------|
| `/`                  | Главная (текущая игра)       | `index.htm`       |
| `/game`              | Новая игра (выбор темы/таймера) | `game.htm`     |
| `/game/results`      | Результаты игры              | `game_results.htm`|
| `/questions/new`     | Новый вопрос                 | `new_question.htm`|
| `/users/:id`         | Профиль пользователя         | `user.htm`        |
| `/users`             | Список людей                 | — (заглушка)      |
| `/ratings`           | Рейтинги                     | — (заглушка)      |
| `/pvp`               | PvP                          | — (заглушка)      |
| `/login`             | Вход                         | — (новая)         |
| `/register`          | Регистрация                  | — (новая)         |

---

## Пункт 1: Библиотека компонентов + Storybook

> **Разработку начинаем с компонентной библиотеки.** Каждый компонент изолирован, задокументирован в Storybook и использует моки вместо реального API. Storybook с моками позволяет разрабатывать и отлаживать UI без бэкенда.

### 1.1 Инициализация проекта

```bash
npm create vite@latest packages/frontend -- --template react-ts
cd packages/frontend
npx storybook@latest init
npm install @tanstack/react-query @tanstack/react-store @tanstack/react-router
npm install -D sass msw msw-storybook-addon @storybook/addon-essentials
```

### 1.2 Настройка SCSS

Глобальные файлы в `src/styles/`:

```
styles/
├── _variables.scss      # Цвета, шрифты, размеры, breakpoints
├── _mixins.scss         # Примеси (media queries, flex, transitions)
├── _reset.scss          # CSS Reset / Normalize
└── global.scss          # Импорт всех выше + базовые стили body, a, h1-h6
```

#### Цветовая схема (из legacy CSS)

```scss
$color-bg:          #D9D7C2;
$color-white:       #FFFFFF;
$color-black:       #000000;
$color-primary:     #F9A253;   // orange (nav, highlights)
$color-accent:      #FF6633;   // red-orange (selected, alerts)
$color-success:     #37CE74;   // green (correct)
$color-error:       #FF0000;   // red (wrong)
$color-muted:       #6E9A90;   // muted green (correct-but-wrong-block)
$color-dark:        #0E2136;   // dark blue (nav text)
$color-dark-bg:     #182C3F;   // breadcrumb bg
$color-light-bg:    #EDEBD2;   // nav bg
$color-border:      #C5C9CD;   // answer border
```

### 1.3 Atomic Design — полное дерево компонентов

#### Atoms (атомарные, не содержат бизнес-логики)

> Каждый атом — самодостаточный компонент, не зависящий от других компонентов. Стили через SCSS Modules. Все используют `forwardRef` для проброса ref на корневой DOM-элемент.

---

##### 1. `Button`

Стилизация нативного `<button>`. Использует `forwardRef`.

```ts
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'link' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Визуальный вариант */
  variant?: ButtonVariant;
  /** Размер */
  size?: ButtonSize;
  /** Показать спиннер вместо текста */
  loading?: boolean;
  /** Кнопка на всю ширину родителя */
  fullWidth?: boolean;
  /** Иконка слева от текста (Unicode char) */
  iconLeft?: string;
  /** Иконка справа от текста */
  iconRight?: string;
}
```

| Variant    | Фон                    | Текст  | Граница               | Применение                            |
|-----------|------------------------|--------|-----------------------|---------------------------------------|
| `primary` | `$color-primary`       | `#000` | —                     | Основные действия (СТАРТ, Отправить)   |
| `secondary`| `$color-bg-dark`      | `#FFF` | —                     | Менее важные действия                  |
| `danger`  | `$color-error`         | `#FFF` | —                     | Удаление, «внезапно прекратить»       |
| `link`    | `transparent`          | `$color-text` | `1px dotted $color-text` | Текстовые ссылки-кнопки            |
| `ghost`   | `transparent`          | `$color-text` | —               | Иконки, малозаметные действия         |

| Size | padding         | font-size       |
|------|-----------------|-----------------|
| `sm` | `2px 8px`       | `$font-size-sm` |
| `md` | `5px 16px`      | `$font-size-md` |
| `lg` | `10px 32px`     | `$font-size-2xl`|

**Состояния:** `:hover` (затемнение фона на 10%), `:focus-visible` (outline 2px `$color-primary`), `:disabled` (opacity 0.5), `loading` (спиннер + aria-busy).

**SCSS Module** (`Button.module.scss`):
```scss
.button { /* reset, cursor, inline-flex, align-center, gap, border-radius 4px */ }
.primary { background: $color-primary; color: #000; &:hover { background: darken($color-primary, 10%); } }
.secondary { background: $color-bg-dark; color: #fff; }
.danger { background: $color-error; color: #fff; }
.link { background: transparent; border-bottom: 1px dotted; border-radius: 0; }
.ghost { background: transparent; }
.sm { padding: 2px 8px; font-size: $font-size-sm; }
.md { padding: 5px 16px; font-size: $font-size-md; }
.lg { padding: 10px 32px; font-size: $font-size-2xl; }
.fullWidth { width: 100%; }
.loading { /* opacity + cursor wait */ }
.disabled { opacity: 0.5; cursor: not-allowed; }
```

**Storybook-истории (11 stories):**
- `Primary`, `Secondary`, `Danger`, `Link`, `Ghost` — все варианты в md
- `Sizes` — 3 кнопки в ряд (sm, md, lg)
- `FullWidth` — на всю ширину контейнера
- `WithIcons` — с иконкой слева, с иконкой справа
- `Loading` — disabled + спиннер
- `Disabled` — все варианты с `disabled`
- `AsLink` — `render` как `<a href="#">` (через `as` prop или render)

---

##### 2. `Input`

Нативный `<input>` с обёрткой для лейбла, хинта и ошибки.

```ts
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Текст лейбла над инпутом */
  label?: string;
  /** Текст подсказки под инпутом */
  hint?: string;
  /** Текст ошибки (показывает красную обводку + сообщение) */
  error?: string;
  /** Размер */
  size?: 'sm' | 'md' | 'lg';
  /** Ширина на всю строку */
  fullWidth?: boolean;
  /** Иконка внутри инпута слева */
  iconLeft?: string;
  /** Иконка внутри инпута справа */
  iconRight?: string;
}
```

**Состояния:**
- `default` — светло-серый фон `#FFF`, рамка `$color-border`
- `focused` — рамка `$color-primary`, outline
- `error` — рамка `$color-error`, красный текст ошибки под инпутом
- `disabled` — opacity 0.5, cursor not-allowed, серый фон

**SCSS Module** (`Input.module.scss`):
```scss
.wrapper { display: flex; flex-direction: column; gap: 4px; }
.label { font-size: $font-size-sm; color: $color-text-dark; }
.inputWrapper { position: relative; display: flex; align-items: center; }
.input {
  width: 100%; border: 1px solid $color-border; background: $color-white;
  color: $color-text; font-family: $font-family;
  &:focus { border-color: $color-primary; outline: none; }
  &.error { border-color: $color-error; }
}
.icon { position: absolute; top: 50%; transform: translateY(-50%); font-size: 1.2em; }
.iconLeft { left: 8px; & + .input { padding-left: 30px; } }
.iconRight { right: 8px; & ~ .input { padding-right: 30px; } }
.hint { font-size: $font-size-sm; color: $color-muted; }
.errorText { font-size: $font-size-sm; color: $color-error; }
// sizes
.sm { padding: 2px 8px; font-size: $font-size-sm; }
.md { padding: 5px 10px; font-size: $font-size-md; }
.lg { padding: 8px 14px; font-size: $font-size-lg; }
```

**Storybook-истории (8 stories):**
- `Default` — пустой text input
- `WithLabel` — с лейблом «Имя пользователя»
- `WithHint` — с подсказкой «Минимум 3 символа»
- `WithError` — рамка красная + «Это поле обязательно»
- `Disabled` — серый фон
- `Password` — type="password" с кнопкой показать/скрыть
- `WithIcons` — иконка поиска слева
- `Sizes` — sm, md, lg в столбик

---

##### 3. `Textarea`

Нативный `<textarea>` с авто-ресайзом по содержимому.

```ts
interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  /** Автоматически увеличивать высоту по содержимому */
  autoResize?: boolean;
  /** Минимальное количество строк (для autoResize) */
  minRows?: number;
  /** Максимальное количество строк (для autoResize) */
  maxRows?: number;
}
```

**Состояния:** аналогичны `Input` (default, focused, error, disabled).

**Авто-ресайз:** через `useRef` + `useLayoutEffect` — при изменении `value` вычисляется `scrollHeight`, устанавливается `style.height`. Ограничивается `minRows`/`maxRows`.

**SCSS Module** (`Textarea.module.scss`):
```scss
.textarea {
  resize: vertical; border: 1px solid $color-border;
  font-family: $font-family; color: $color-text;
  &:focus { border-color: $color-primary; outline: none; }
  &.error { border-color: $color-error; }
  &.noResize { resize: none; overflow: hidden; }
}
// sizes — аналогично Input
```

**Storybook-истории (6 stories):**
- `Default` — 4 строки, placeholder «Введите текст...»
- `WithLabel` — «Текст вопроса»
- `WithError` — «Вопрос не может быть пустым»
- `AutoResize` — печатает много текста, поле растёт
- `MinMaxRows` — minRows=3, maxRows=8
- `Disabled`

---

##### 4. `Select`

Кастомный селект, стилизующий нативный `<select>` без JS-попапа (для простоты используем нативный `<select>` со стилизацией).

```ts
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  options: SelectOption[];
  /** Плейсхолдер (первый option с disabled) */
  placeholder?: string;
}
```

**Стилизация:** кастомная стрелка через `appearance: none` + background-image (SVG-стрелка), кастомный бордер, фокус.

**SCSS Module** (`Select.module.scss`):
```scss
.select {
  appearance: none; border: 1px solid $color-border;
  background: $color-white url("data:image/svg+xml,...") no-repeat right 8px center;
  padding-right: 32px; cursor: pointer; font-family: $font-family;
  &:focus { border-color: $color-primary; outline: none; }
  &.error { border-color: $color-error; }
}
```

**Storybook-истории (5 stories):**
- `Default` — список из 5 опций
- `WithPlaceholder` — «Выберите время...»
- `WithLabel` — «Количество вопросов»
- `WithError` — рамка красная
- `Disabled`

---

##### 5. `Radio`

Кастомная radio-кнопка, стилизованная в стиле Megabrain.

```ts
interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Текст лейбла */
  label: string;
  /** Позиция лейбла */
  labelPosition?: 'left' | 'right';
  size?: 'sm' | 'md';
}
```

**Кастомный radio-кружок:** скрытый нативный `<input>`, визуальный кружок через `::before` на `<span>`. При `:checked` — оранжевая точка внутри.

**SCSS Module** (`Radio.module.scss`):
```scss
.wrapper { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.input { @include visually-hidden; }
.circle {
  width: 18px; height: 18px; border: 2px solid $color-border;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: border-color $transition-speed;
}
.input:checked + .circle {
  border-color: $color-accent;
  &::after { content: ''; width: 10px; height: 10px; background: $color-accent; border-radius: 50%; }
}
.input:focus-visible + .circle { @include focus-ring; }
.label { font-size: $font-size-md; }
```

**Storybook-истории (4 stories):**
- `Default` — одиночный, не выбран
- `Checked` — выбран
- `Group` — 3 radio с одним `name`, один выбран
- `Disabled` — неактивный

---

##### 6. `Checkbox`

Кастомный чекбокс с галочкой в стиле Megabrain.

```ts
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label: string;
  labelPosition?: 'left' | 'right';
  /** Неопределённое состояние (квадратик) */
  indeterminate?: boolean;
  size?: 'sm' | 'md';
}
```

**SCSS Module** (`Checkbox.module.scss`):
```scss
.wrapper { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.input { @include visually-hidden; }
.box {
  width: 18px; height: 18px; border: 2px solid $color-border;
  border-radius: 3px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; background: $color-white;
}
.input:checked + .box {
  background: $color-accent; border-color: $color-accent;
  &::after { content: '✓'; color: $color-white; font-size: 12px; font-weight: bold; }
}
.input:indeterminate + .box {
  background: $color-accent; border-color: $color-accent;
  &::after { content: '–'; color: $color-white; font-size: 14px; font-weight: bold; }
}
```

**Storybook-истории (5 stories):**
- `Default` — не выбран
- `Checked` — выбран
- `Indeterminate` — неопределённое состояние
- `Disabled` — неактивный (и unchecked, и checked)
- `WithLongLabel` — «только новые (159)»

---

##### 7. `TimerDigit`

Отображает один символ таймера с использованием legacy-спрайта `digits.png`. В будущем можно заменить на CSS/текст, но для первого этапа — точное соответствие оригиналу.

```ts
type TimerChar = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'c' | 'd';

interface TimerDigitProps {
  /** Символ для отображения */
  char: TimerChar;
  /** Размер (умножает фоновый размер) */
  scale?: number;
}
```

**Реализация:** `<span>` фиксированного размера с `background-image: url('/i/digits.png')` и `background-position` по карте спрайта. Размеры цифр: `0` — 20×26px, `1` — 13×26px, `c`/`d` (colon/dot) — 10×26px.

**Позиции спрайта (из legacy `style.css`):**
| char | background-position |
|------|---------------------|
| `c`  | `-22px -14px`       |
| `d`  | `-44px -14px`       |
| `0`  | `-59px -14px`       |
| `1`  | `-86px -14px`       |
| `2`  | `-108px -14px`      |
| `3`  | `-136px -14px`      |
| `4`  | `-165px -14px`      |
| `5`  | `-194px -14px`      |
| `6`  | `-222px -14px`      |
| `7`  | `-250px -14px`      |
| `8`  | `-279px -14px`      |
| `9`  | `-307px -14px`      |

**SCSS Module** (`TimerDigit.module.scss`):
```scss
.digit {
  display: inline-block; vertical-align: top;
  height: 26px; background: url('/i/digits.png') no-repeat;
  &.c { width: 10px; background-position: -22px -14px; }
  &.d { width: 10px; background-position: -44px -14px; }
  &.n0 { width: 20px; background-position: -59px -14px; }
  &.n1 { width: 13px; background-position: -86px -14px; }
  &.n2 { width: 20px; background-position: -108px -14px; }
  &.n3 { width: 20px; background-position: -136px -14px; }
  &.n4 { width: 20px; background-position: -165px -14px; }
  &.n5 { width: 20px; background-position: -194px -14px; }
  &.n6 { width: 20px; background-position: -222px -14px; }
  &.n7 { width: 20px; background-position: -250px -14px; }
  &.n8 { width: 20px; background-position: -279px -14px; }
  &.n9 { width: 20px; background-position: -307px -14px; }
}
```

**Storybook-истории (3 stories):**
- `AllDigits` — все 12 символов в ряд: 0 1 2 3 4 5 6 7 8 9 c d
- `Timer` — пример таймера: `00c12d45` (как в оригинале: минуты, двоеточие, секунды, точка, сантисекунды)
- `Scaled` — scale={2}

---

##### 8. `Badge`

Цветной бейдж для статусов и меток.

```ts
type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'muted';

interface BadgeProps {
  variant?: BadgeVariant;
  /** Закруглённый (pill) или прямоугольный */
  pill?: boolean;
  /** Размер */
  size?: 'sm' | 'md';
  children: React.ReactNode;
}
```

| Variant   | Фон             | Текст             |
|-----------|-----------------|-------------------|
| `success` | `$color-success` | `#FFF`            |
| `error`   | `$color-error`   | `#FFF`            |
| `warning` | `$color-primary` | `#000`            |
| `info`    | `$color-bg-dark` | `$color-primary`  |
| `muted`   | `$color-muted`   | `#FFF`            |

**SCSS Module** (`Badge.module.scss`):
```scss
.badge { display: inline-block; padding: 2px 8px; font-size: $font-size-sm; line-height: 1.4; }
.pill { border-radius: 999px; }
.success { background: $color-success; color: #fff; }
.error { background: $color-error; color: #fff; }
.warning { background: $color-primary; color: #000; }
.info { background: $color-bg-dark; color: $color-primary; }
.muted { background: $color-muted; color: #fff; }
.sm { padding: 1px 6px; font-size: 0.7em; }
```

**Storybook-истории (5 stories):**
- `AllVariants` — все 5 вариантов в ряд
- `Pill` — все варианты с `pill`
- `Sizes` — sm и md
- `WithText` — «верный ответ», «ошибка», «12 вопросов»
- `LongText` — «ваш ответ неверен»

---

##### 9. `Icon`

Рендерит Unicode-символ с правильным размером и выравниванием. Основа для иконок навигации, декоративных символов.

```ts
interface IconProps {
  /** Unicode-символ (строка из 1-2 code points) */
  symbol: string;
  /** Размер */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'inherit';
  /** Цвет (любой цвет из палитры) */
  color?: string;
  /** CSS-цвет, переопределяющий color */
  customColor?: string;
  /** Кликабельная иконка? */
  onClick?: () => void;
  /** aria-label для доступности */
  label?: string;
  /** Дополнительный className */
  className?: string;
}
```

**Размеры:**
| size      | font-size    |
|-----------|-------------|
| `sm`      | `0.7em`     |
| `md`      | `1em`       |
| `lg`      | `1.6em`     |
| `xl`      | `2em`       |
| `inherit` | `inherit`   |

**SCSS Module** (`Icon.module.scss`):
```scss
.icon { display: inline-flex; align-items: center; justify-content: center; line-height: 1; }
.clickable { cursor: pointer; &:hover { opacity: 0.8; } }
.sm { font-size: 0.7em; }
.md { font-size: 1em; }
.lg { font-size: 1.6em; }
.xl { font-size: 2em; }
```

**Storybook-истории (4 stories):**
- `NavIcons` — ряд из 5 навигационных иконок: § Игра, ⚔ PvP, ⚒ Вопросы, ☭ Люди, ✡ Рейтинги
- `Sizes` — один символ § в 4 размерах
- `Clickable` — иконка с onClick (показать alert)
- `LevelIcons` — сетка иконок уровней (все доступные символы из профиля: ♙♚♛⚀⚁...)

---

##### 10. `Divider`

Горизонтальная разделительная линия. Может содержать текст по центру (как в `<hr>` с текстом).

```ts
type DividerVariant = 'solid' | 'dashed' | 'dotted';

interface DividerProps {
  variant?: DividerVariant;
  /** Текст по центру линии */
  label?: string;
  /** Отступы сверху/снизу */
  spacing?: 'sm' | 'md' | 'lg';
  /** Цвет линии */
  color?: string;
}
```

**SCSS Module** (`Divider.module.scss`):
```scss
.wrapper { display: flex; align-items: center; width: 100%; }
.line { flex: 1; border: none; height: 0; }
.solid { border-top: 1px solid; }
.dashed { border-top: 1px dashed; }
.dotted { border-top: 1px dotted; }
.label { padding: 0 12px; font-size: $font-size-sm; color: $color-muted; white-space: nowrap; }
.spacingSm { margin: 8px 0; }
.spacingMd { margin: 16px 0; }
.spacingLg { margin: 24px 0; }
```

**Storybook-истории (4 stories):**
- `Solid` — сплошная линия
- `Dashed` — пунктирная
- `WithLabel` — линия с текстом «или» по центру
- `Spacing` — три разделителя с разными spacing

---

##### 11. `Spinner`

Индикатор загрузки. Чистый CSS, без внешних зависимостей. Использует псевдоэлементы для анимации.

```ts
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Цвет спиннера */
  color?: string;
  /** Текст для скринридеров */
  label?: string;
  /** Встроенный (inline) или блочный */
  inline?: boolean;
}
```

**Реализация:** `<span>` с `border-radius: 50%`, `border: 3px solid transparent`, `border-top-color: $color-accent`, `animation: spin 0.6s linear infinite`. Размер через width/height.

**SCSS Module** (`Spinner.module.scss`):
```scss
.spinner {
  display: block; border-radius: 50%;
  border: 3px solid $color-bg-light;
  border-top-color: $color-accent;
  animation: spin 0.6s linear infinite;
}
.inline { display: inline-block; }
.sm { width: 16px; height: 16px; border-width: 2px; }
.md { width: 32px; height: 32px; border-width: 3px; }
.lg { width: 48px; height: 48px; border-width: 4px; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Storybook-истории (3 stories):**
- `Default` — md спиннер
- `Sizes` — sm, md, lg в ряд
- `CustomColor` — зелёный спиннер (для success-состояний)

---

##### 12. `Tooltip`

Всплывающая подсказка при наведении/фокусе. Используется для пояснения иконок, title-атрибутов, breadcrumbs.

```ts
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  /** Текст подсказки */
  text: string;
  /** Позиция относительно элемента */
  position?: TooltipPosition;
  /** Триггер показа */
  trigger?: 'hover' | 'click' | 'focus';
  /** Задержка перед показом (ms) */
  delay?: number;
  /** Дочерний элемент, на который вешается тултип */
  children: React.ReactNode;
}
```

**Реализация:** обёртка над `children` с `onMouseEnter`/`onMouseLeave`, позиционирование через `useRef` + `getBoundingClientRect`. Показ/скрытие с opacity-переходом 200ms.

**SCSS Module** (`Tooltip.module.scss`):
```scss
.wrapper { position: relative; display: inline-flex; }
.tooltip {
  position: absolute; z-index: 100; opacity: 0; pointer-events: none;
  transition: opacity 0.2s; font-size: $font-size-sm; padding: 4px 8px;
  background: $color-bg-dark; color: $color-text-light; border-radius: 4px;
  white-space: nowrap;
  &.visible { opacity: 1; }
  &.top { bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 4px; }
  &.bottom { top: 100%; left: 50%; transform: translateX(-50%); margin-top: 4px; }
  &.left { right: 100%; top: 50%; transform: translateY(-50%); margin-right: 4px; }
  &.right { left: 100%; top: 50%; transform: translateY(-50%); margin-left: 4px; }
}
```

**Storybook-истории (4 stories):**
- `Hover` — тултип при наведении на кнопку
- `Positions` — 4 позиции на одном элементе
- `LongText` — длинный текст не переносится (`white-space: nowrap`)
- `WithIcon` — тултип на иконке уровня «Ваш уровень, чтобы это не значило.»

---

**Сводка: структура директории `atoms/`**

```
src/components/atoms/
├── Button/
│   ├── Button.tsx
│   ├── Button.module.scss
│   ├── Button.stories.tsx
│   ├── Button.test.tsx
│   └── index.ts
├── Input/
│   ├── Input.tsx
│   ├── Input.module.scss
│   ├── Input.stories.tsx
│   ├── Input.test.tsx
│   └── index.ts
├── Textarea/
│   └── ... (аналогично)
├── Select/
│   └── ...
├── Radio/
│   └── ...
├── Checkbox/
│   └── ...
├── TimerDigit/
│   └── ...
├── Badge/
│   └── ...
├── Icon/
│   └── ...
├── Divider/
│   └── ...
├── Spinner/
│   └── ...
└── Tooltip/
    └── ...
```

**Общий `index.ts` barrel-экспорт:**
```ts
// src/components/atoms/index.ts
export { Button } from './Button'
export type { ButtonProps } from './Button'
export { Input } from './Input'
export type { InputProps } from './Input'
// ... остальные
```

#### Molecules (составные, с минимальной логикой)

| Компонент             | Файл                         | Описание                                    |
|-----------------------|------------------------------|---------------------------------------------|
| `AuthLinks`           | `molecules/AuthLinks/`       | «войти | зарегистрироваться»                |
| `Breadcrumbs`         | `molecules/Breadcrumbs/`     | Хлебные крошки: Игра → Астрономия          |
| `SearchForm`          | `molecules/SearchForm/`      | Поиск тем по ключевым словам               |
| `AnswerOption`        | `molecules/AnswerOption/`    | Кликабельный вариант ответа (1-4) с текстом |
| `AnswerResultItem`    | `molecules/AnswerResultItem/`| Вариант ответа в результатах (правильно/неправильно/пропущено) |
| `Timer`               | `molecules/Timer/`           | Таймер из цифр (MM:SS:CC)                  |
| `TopicCard`           | `molecules/TopicCard/`       | Заголовок темы § + список подтем + «выбрать все»/«отменить» + «показать все» |
| `SubtopicBadge`       | `molecules/SubtopicBadge/`   | Выбранная подтема — оранжевый фон `#FF6633`, белый текст |
| `GameQuitConfirm`     | `molecules/GameQuitConfirm/` | Инлайн-диалог: «да, уходим» / «нет, продолжаем» |
| `TimeSettingRow`      | `molecules/TimeSettingRow/`  | Radio + Select для настройки времени (на вопрос / на игру) |
| `ExpandableSection`   | `molecules/ExpandableSection/`| Раскрывающийся блок: «почитать про это» / «показать все» |
| `Toast`               | `molecules/Toast/`           | Уведомление correct/wrong/info снизу экрана. Авто-скрытие, кнопка закрытия. Наследует `futu_alert` |
| `IconPicker`          | `molecules/IconPicker/`      | Текущая иконка + раскрывающаяся сетка 50+ символов. Клик меняет текущую |
| `InlineEdit`          | `molecules/InlineEdit/`      | Клик для редактирования: текст → форма → Сохранить/Отмена |
| `Tabs`                | `molecules/Tabs/`            | Переключатель вкладок (файл / ссылка / youtube). Активная — оранжевый фон |
| `SearchCheck`         | `molecules/SearchCheck/`     | Ссылки на Google/Yandex с предзаполненным текстом вопроса |
| `TimeEstimator`       | `molecules/TimeEstimator/`   | Динамический расчёт: «(10 минут на игру)» из времени/вопроса × кол-ва вопросов |

**Props (примеры):**

```ts
// AnswerOption
interface AnswerOptionProps {
  number: 1 | 2 | 3 | 4;
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Визуальное состояние: idle | hover | selected | correct | wrong */
  state?: 'idle' | 'selected' | 'correct' | 'wrong';
}

// Toast — наследник futu_alert(text, closeable, variant, width, height)
interface ToastProps {
  /** Тип уведомления: correct (зелёная рамка 5px), wrong (красная рамка 5px), info (оранжевая рамка 3px) */
  variant: 'correct' | 'wrong' | 'info';
  /** Текст (может содержать HTML — поддержка <strong>) */
  message: string;
  /** Показывать кнопку закрытия (close.gif)? */
  closeable?: boolean;
  /** Ширина в px (по умолчанию 600 для info, 100 для correct/wrong) */
  width?: number;
  /** Авто-скрытие через N ms (0 — не скрывать) */
  autoHide?: number;
  onClose?: () => void;
}

// IconPicker — из levelIconHandler.setIcon() + 50+ символов уровня
interface IconPickerProps {
  /** Текущая выбранная иконка */
  value: string;
  /** Доступные иконки (массив Unicode-символов) */
  icons: string[];
  onChange: (icon: string) => void;
  /** Размер иконок в сетке */
  size?: 'sm' | 'md' | 'lg';
}

// InlineEdit — 4 режима в профиле
interface InlineEditProps {
  /** Текущее значение для отображения */
  value: string;
  /** Тип редактирования: text (один input), textarea, select, password, radio */
  editType?: 'text' | 'textarea' | 'select' | 'password' | 'radio';
  /** Опции для editType='select' или 'radio' */
  options?: { value: string; label: string }[];
  /** Колбэк при сохранении */
  onSave: (value: string) => void;
  /** Текст для пустого значения */
  placeholder?: string;
}

// Tabs — переключатель медиа в new_question (файл/ссылка/youtube)
interface TabsProps {
  /** Вкладки */
  items: { key: string; label: string; icon?: string; title?: string }[];
  /** Активная вкладка */
  activeKey: string;
  onChange: (key: string) => void;
  children: React.ReactNode; // содержимое активной вкладки
}

// SearchCheck — Google/Yandex предзаполненные ссылки
interface SearchCheckProps {
  /** Текст вопроса для поиска */
  questionText: string;
}

// TopicCard — обновлённые Props с SelectAll и ShowMore
interface TopicCardProps {
  topic: Topic;
  /** Режим: 'select' (с выбором) или 'profile' (схлопывание [+]/[-]) */
  mode: 'select' | 'profile';
  /** Выбранные подтемы (для mode='select') */
  selectedIds?: number[];
  /** Максимум видимых подтем до «показать все» */
  visibleLimit?: number;
  onSelectAll?: () => void;
  onSelectSubtopic?: (id: number) => void;
}

// Timer — обновлённые Props (формат MM:SS:CC)
interface TimerProps {
  /** Прошедшее время в сантисекундах (1/100 секунды). Каждые 60ms — новый рендер */
  elapsedCentiseconds: number;
  /** Общее время в сантисекундах (для обратного отсчёта) */
  totalCentiseconds?: number;
  /** Направление: up (хронометр) или down (таймер) */
  direction?: 'up' | 'down';
  isPaused?: boolean;
}
```

#### Organisms (блоки интерфейса с бизнес-логикой)

| # | Компонент           | Файл                         | Состав (из чего собран)                                              |
|---|---------------------|------------------------------|----------------------------------------------------------------------|
| 1 | `Header`            | `organisms/Header/`          | Logo + AuthLinks (войти/выйти)                                       |
| 2 | `Sidebar`           | `organisms/Sidebar/`         | NavItems + Copyrights                                                |
| 3 | `Layout`            | `organisms/Layout/`          | Header + Sidebar + Breadcrumbs + контентная область                  |
| 4 | `GameBoard`         | `organisms/GameBoard/`       | Timer + QuestionCard + AnswerGrid + GameQuitConfirm + ToastContainer |
| 5 | `TopicList`         | `organisms/TopicList/`       | SearchForm + TopicCard[] + CloseButton + QuestionCounter             |
| 6 | `NewGameForm`       | `organisms/NewGameForm/`     | TopicList + TimeSettingRow[] + Checkbox + Select + Button(СТАРТ)    |
| 7 | `GameResults`       | `organisms/GameResults/`     | ResultHeader + StatsSummary + AnswerResultItem[]                     |
| 8 | `UserProfile`       | `organisms/UserProfile/`     | IconPicker + InlineEdit[] + TopicCard[](profile mode)                |
| 9 | `NewQuestionForm`   | `organisms/NewQuestionForm/` | Tabs(file/uri/video) + Textarea + Input[] + TopicList + SearchCheck  |
| 10| `AuthForm`          | `organisms/AuthForm/`        | Input[] + Button (войти / зарегистрироваться)                        |
| 11| `LoginPage`         | `routes/login.tsx`           | AuthForm (login)                                                     |
| 12| `RegisterPage`      | `routes/register.tsx`        | AuthForm (register)                                                  |
| 13| `RatingsPage`       | `routes/ratings.tsx`         | Таблица лидеров (TBD)                                                |
| 14| `PvPPage`           | `routes/pvp.tsx`             | PvP-лобби (TBD)                                                      |

**Подробные спецификации:**

> Organisms — это готовые блоки страниц, собираемые из Atoms и Molecules. Каждый organism содержит бизнес-логику (стейт, обработчики, интеграцию с API через TanStack Query — позже). На этапе разработки organism работает с мок-данными.

---

##### 1. `Header`

Самый простой organism. Логотип-ссылка на главную + блок авторизации.

```ts
interface HeaderProps {
  isLoggedIn?: boolean
  nickname?: string
}
```

**Состав:**
- `.l-header` — позиционирование
- `.b-logo` — `<a href="/">` с фоновым логотипом
- AuthLinks — «войти | зарегистрироваться» или «ник | выйти»

---

##### 2. `Sidebar`

Навигация и копирайт. Принимает `activeNav` для подсветки.

```ts
interface SidebarProps {
  activeNav: 'game' | 'pvp' | 'questions' | 'people' | 'ratings'
}
```

**Состав:**
- `b-nav` — 5 пунктов с юникод-иконками
- `b-nav--active` — подсветка активного пункта (шире, оранжевый)
- `b-copyrights` — копирайт + текст о закрытом тестировании

---

##### 3. `Layout`

Собирает страницу из Header + Sidebar + Breadcrumbs + контента. **Это корневой компонент для всех страниц.**

```ts
interface LayoutProps {
  activeNav: SidebarProps['activeNav']
  breadcrumbs: BreadcrumbItem[]
  children: ReactNode
}
```

**Структура DOM:**
```
.l-page
  .l-header → <Header />
  .b-breadcrumbs → <Breadcrumbs items={breadcrumbs} />
  .l-aside → <Sidebar activeNav={activeNav} />
  .l-content
    .l-i-content
      {children}
```

**SCSS:** уже реализован в `global.scss` как статическая раскладка. Layout organism просто собирает компоненты в эту структуру.

---

##### 4. `GameBoard`

Главный игровой экран. Управляет всем циклом игры: таймер, вопрос, ответы, пропуск, выход.

```ts
interface GameBoardProps {
  questions: Question[]
  onFinish: (results: GameResult) => void
}
```

**Внутренний стейт:**
- `currentIndex` — текущий вопрос
- `correctCount` — счётчик правильных
- `timerCs` — таймер в сантисекундах (useEffect + setInterval 10ms)
- `answerState: 'idle' | 'revealed'` — отвечает или показывает результат

**Состав:**
- `Timer` — хронометр (elapsedCentiseconds)
- `.b-game-current-result` — «3 ответа из 26 (66%)»
- `.b-game-question-about-pic` — картинка к вопросу
- `.b-game-question` — текст вопроса
- `AnswerGrid` — 4 варианта ответа
- `.b-game-skip-question` — кнопка «Пропустить»
- `GameQuitConfirm` — «внезапно прекратить игру»
- `ToastContainer` — правильный/неправильный ответ

**Flow взаимодействия:**
1. Таймер запущен → пользователь видит вопрос
2. Клик по ответу → пауза таймера → AnswerGrid показывает correct/wrong → Toast
3. Автоматический переход к следующему вопросу через 1.5s
4. Последний вопрос → `onFinish(results)`

---

##### 5. `TopicList`

Список всех тем с поиском, выбором подтем и счётчиком вопросов.

```ts
interface TopicListProps {
  topics: Topic[]
  selectedIds: number[]
  mode?: 'select' | 'modal'
  onSelectSubtopic: (id: number) => void
  onSelectAll: (topicId: number) => void
  onClose?: () => void   // для mode='modal'
}
```

**Состав:**
- `SearchForm` — поиск по ключевым словам
- `TopicCard[]` — 6 карточек тем с подтемами
- `CloseButton` — ✖ (для mode='modal')
- Счётчик — «3510 вопросов» (сумма по выбранным подтемам)

**SCSS:** layout — сетка 3 колонки (`width: 32%; float: left`). В модальном режиме — `border: 1px; border-radius: 10px; padding: 15px` + абсолютно спозиционированная кнопка закрытия.

---

##### 6. `NewGameForm`

Форма настройки и запуска игры. Собирает выбранные темы, время, количество вопросов.

```ts
interface NewGameFormProps {
  topics: Topic[]
  onStart: (config: GameConfig) => void
}

interface GameConfig {
  subtopicIds: number[]
  timeMode: 'per_question' | 'per_game'
  timeValueSeconds: number
  questionCount: number
  onlyNew: boolean
}
```

**Состав:**
- `TopicList` — выбор тем
- `TimeSettingRow × 2` — «на вопрос» / «на игру» с Divider («или»)
- `Checkbox` — «только новые (159)»
- `Select` — количество вопросов (10/20/50/100/все)
- `TimeEstimator` — динамический расчёт времени
- `Button(lg)` — «СТАРТ!»
- Счётчик — «3510 вопросов»

**Логика:**
- При изменении выбора подтем → пересчёт счётчика вопросов
- При изменении времени → пересчёт TimeEstimator
- «СТАРТ!» → `onStart(config)`

---

##### 7. `GameResults`

Страница результатов игры: статистика + список всех вопросов с подсветкой правильных/неправильных.

```ts
interface GameResultsProps {
  results: {
    header: string              // «Вы сегодня творите чудеса!»
    answeredCorrect: number
    totalQuestions: number
    missedCount: number
    timeMinutes: number
    avgSeconds: number
    items: AnswerResultItemProps[]
  }
}
```

**Состав:**
- `ResultHeader` — плашка с текстом (тень, border-radius, рамка #47666B)
- Статистика — «За 20 минут верно 10 из 98 вопросов. На 2 не успели. Среднее время — 10 секунд.»
- `AnswerResultItem[]` — список карточек-сводок

**SCSS:** `b-game_result_header` — float:left, box-shadow, border. Каждая ResultItem — `border: 1px; border-radius: 10px; margin-bottom: 30px; padding: 15px`.

---

##### 8. `UserProfile`

Страница профиля пользователя.

```ts
interface UserProfileProps {
  user: {
    level: number
    icon: string
    nickname: string
    name: string
    location: string
    firstSeen: string
    topics: { name: string; subtopics: string[] }[]
  }
  isOwner?: boolean   // свой профиль — можно редактировать
}
```

**Состав:**
- `IconPicker` — иконка уровня + палитра
- `InlineEdit` × 4 — nickname, имя, пол, локация
- `TopicCard[]` (profile mode) — схлопывание подтем [+]/[-]
- Номер уровня + дата регистрации

**SCSS:** левая колонка 48% (профиль), правая 48% (темы). `.b-userpage_nickname h1 { display: inline }` — ник в строку с иконкой.

---

##### 9. `NewQuestionForm`

Форма создания нового вопроса пользователем.

```ts
interface NewQuestionFormProps {
  topics: Topic[]
  onSubmit: (question: NewQuestion) => void
}

interface NewQuestion {
  text: string
  answers: [string, string, string, string]
  correctIndex: number   // 0-3
  media?: { type: 'file' | 'uri' | 'video'; value: string }
  subtopicIds: number[]
}
```

**Состав:**
- `Tabs` — переключатель: файл / ссылка / youtube
- `FileInput` / `Input` / `Input` — в зависимости от выбранного таба
- `FieldNote` — «Ваше право на подсказку сохраняется законами»
- `Textarea` — текст вопроса
- `AnswerOption × 4` — поля для 4 вариантов ответа (Input внутри)
- AI-подсказка темы — клик раскрывает блок
- `TopicList` (modal) — «К черту кремний, покажите список»
- `SearchCheck` — Google/Yandex проверка
- `Button(lg)` — «Добавить вопрос!»

---

##### 10. `AuthForm`

Форма входа / регистрации. Два режима.

```ts
interface AuthFormProps {
  mode: 'login' | 'register'
  onSubmit: (data: { login: string; password: string; email?: string }) => void
  onSwitchMode: () => void
}
```

**Состав:**
- `Input` × 2 (login) / × 3 (register: +email)
- `Button(primary)` — «Войти» / «Зарегистрироваться»
- `Button(link)` — переключение режима

---

##### 11. `RatingsPage` (TBD)

Таблица лидеров. Сортировка по рейтингу/количеству игр/проценту правильных.

```ts
interface RatingsPageProps {
  users: { nickname: string; level: number; icon: string; rating: number; gamesPlayed: number; accuracy: number }[]
  sortBy: 'rating' | 'games' | 'accuracy'
}
```

---

##### 12. `PvPPage` (TBD)

Лобби для игры против другого игрока в реальном времени.

#### Templates + Страницы

**Страницы — это то, что рендерится в `{children}` слота `<Layout>`. Каждая страница — это organism или композиция нескольких organisms.**

```
routes/
├── __root.tsx          # Layout (Header + Sidebar + Breadcrumbs + Outlet)
├── index.tsx           # Главная — GameBoard
├── game.tsx            # Новая игра — NewGameForm
├── game.results.tsx    # Результаты — GameResults
├── questions.new.tsx   # Новый вопрос — NewQuestionForm
├── users.index.tsx     # Список людей (TBD)
├── users.$id.tsx       # Профиль — UserProfile
├── ratings.tsx         # Рейтинги (TBD)
├── pvp.tsx             # PvP (TBD)
├── login.tsx           # Вход — AuthForm
└── register.tsx        # Регистрация — AuthForm
```

**`__root.tsx`** — корневой layout для всех страниц:
```tsx
export default function Root() {
  const { pathname } = useRouterState()
  const activeNav = getActiveNav(pathname)
  const breadcrumbs = getBreadcrumbs(pathname)
  
  return (
    <Layout activeNav={activeNav} breadcrumbs={breadcrumbs}>
      <Outlet />
    </Layout>
  )
}
```

**Пример страницы (`index.tsx`):**
```tsx
export default function GamePage() {
  const [questions] = useState(() => mockQuestions)
  const navigate = useNavigate()
  
  return (
    <GameBoard
      questions={questions}
      onFinish={(results) => navigate('/game/results', { state: results })}
    />
  )
}
```

**Порядок разработки страниц:**
1. `Layout` + `__root.tsx` — каркас
2. `GameBoard` + `index.tsx` — главная (игровой процесс)
3. `NewGameForm` + `game.tsx` — настройка игры
4. `GameResults` + `game.results.tsx` — результаты
5. `UserProfile` + `users.$id.tsx` — профиль
6. `NewQuestionForm` + `questions.new.tsx` — создание вопроса
7. `AuthForm` + `login.tsx` / `register.tsx` — авторизация

#### Ключевые паттерны взаимодействий (из script.js)

##### 1. Flow ответа на вопрос (`demoLoading` → `futu_alert`)

Цепочка из 4 шагов при клике на вариант ответа:
```
1. gameHandler.pauseTimer()          — пауза таймера (мгновенно)
2. demoLoading(button, callback)     — flash-анимация кнопки:
   ├── 0ms:   фон кнопки → оранжевый (morph 333ms)
   ├── 350ms: фон кнопки → белый (morph 333ms)
   └── 700ms: вызов callback
3. futu_alert(text, true, variant, w, h) — показ Toast:
   ├── variant='correct' → зелёная рамка 5px, ширина 100px
   └── variant='wrong'   → красная рамка 5px, ширина 100px
4. Переход к следующему вопросу
```

В React: `onAnswer(index) → setAnswerState('revealing') → setTimeout(700) → setAnswerState('revealed') + showToast → setTimeout(1500) → nextQuestion()`.

##### 2. TimerTick (`gameHandler.setTimer`)

- **Частота обновления:** каждые 60ms (~16.67 fps)
- **Формат данных:** `centiseconds = elapsed_ms / 10` (1/100 секунды)
- **Формат строки:** `MMcSSdCC` — минуты, colon 'c', секунды, dot 'd', сантисекунды
- **Отображение:** рендерится как 10 `<span class="b-game_timer_digit b-game_timer_digit_X">` элементов
- **MM:SS** — всегда 2 цифры (дополнение нулями слева)

##### 3. Select All / Deselect All (`topicHandler.selectAllSubtopics`)

Toggle-поведение:
- Если тема **не выбрана** → добавить `b-topic_selected` на тему, `b-subtopic_selected` на все подтемы, текст кнопки → «отменить»
- Если тема **выбрана** → убрать оба класса, текст кнопки → «выбрать все»
- Индивидуальный toggle подтемы (`selectSubtopic`) — не влияет на состояние Select All

##### 4. Level Icon Swap (`levelIconHandler.setIcon`)

Обмен значениями между текущей и выбранной иконкой (swap, а не set). Реализован через CSS `:focus` на родительской ссылке — без JS. В React: стейт `isOpen` на клик.

##### 5. Inline Edit (профиль)

4 режима редактирования, каждый — отдельный скрытый блок:
- **Ник/email/пароль** — 3 поля: text + text + password
- **Имя** — 1 поле: text
- **Пол** — 2 radio: ♂ мужчина / ♀ женщина
- **Локация** — 2 select: страна + город

##### 6. Медиа-переключатель (`newQuestion.selectAbout`)

3 таба, взаимоисключающие. Активный таб — класс `active` (оранжевый фон). Неактивные инпуты скрыты (`hidden`). Код деселектит все `.active` и `.js-game_new_question_about`, затем активирует выбранный.

### 1.4 Структура файлов компонента (пример — `AnswerOption`)

```
components/molecules/AnswerOption/
├── AnswerOption.tsx         # Компонент
├── AnswerOption.module.scss # SCSS Module
├── AnswerOption.fixture.tsx # Cosmos fixture
└── index.ts                 # Реэкспорт
```

### 1.5 Моки и фикстуры

#### Структура `src/mocks/`

```
mocks/
├── fixtures/
│   ├── topics.ts            # Категории и подтемы
│   ├── questions.ts         # Вопросы с ответами
│   ├── users.ts             # Пользователи
│   ├── gameResults.ts       # Результаты игр
│   └── gameConfig.ts        # Настройки новой игры
├── handlers/
│   ├── auth.ts              # Мок-ручки для JWT
│   ├── topics.ts            # GET /api/topics
│   ├── questions.ts         # GET /api/questions, POST /api/questions
│   ├── game.ts              # POST /api/game/start, POST /api/game/answer, GET /api/game/results
│   └── users.ts             # GET /api/users/:id
├── browser.ts               # Настройка MSW для браузера
└── server.ts                # Настройка MSW для Node (тесты)
```

#### Пример фикстуры `fixtures/topics.ts`

```ts
export interface Subtopic {
  id: number;
  name: string;
}

export interface Topic {
  id: number;
  name: string;
  icon: string;        // §, ⚔, ⚒, ☭, ✡
  subtopics: Subtopic[];
}

export const topics: Topic[] = [
  {
    id: 12, name: 'Биология', icon: '§',
    subtopics: [
      { id: 112, name: 'ЕГЭ 2010' },
      { id: 113, name: 'Микробиология' },
      { id: 114, name: 'Зоология' },
      // ... остальные
    ],
  },
  {
    id: 13, name: 'География', icon: '§',
    subtopics: [ /* ... */ ],
  },
  {
    id: 14, name: 'Физика', icon: '§',
    subtopics: [ /* ... */ ],
  },
  {
    id: 15, name: 'Химия', icon: '§',
    subtopics: [ /* ... */ ],
  },
  {
    id: 16, name: 'Математика', icon: '§',
    subtopics: [ /* ... */ ],
  },
  {
    id: 17, name: 'История', icon: '§',
    subtopics: [ /* ... */ ],
  },
];
```

#### Пример фикстуры `fixtures/questions.ts`

```ts
export interface Question {
  id: number;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  answers: string[];        // 4 строки
  correctIndex: number;     // 0-3
  explanation?: string;
  explanationSource?: string;
  topicId: number;
  subtopicId: number;
}

export const questions: Question[] = [
  {
    id: 1,
    text: 'На какой из планет нашей солнечной системы находится самая крупная гора?',
    imageUrl: '/i/sample_question_pic.jpg',
    answers: ['Сатурн через миллион лет', 'Уран', 'Венера', 'Нептун'],
    correctIndex: 1,
    explanation: 'Гора Олимп (лат. Olympus Mons) — потухший вулкан на Марсе...',
    explanationSource: 'http://ru.wikipedia.org/wiki/Olympus_Mons',
    topicId: 14,
    subtopicId: 300,
  },
  {
    id: 2,
    text: 'У какой планеты солнечной системы больше всего лун?',
    imageUrl: '/i/sample_question_pic_2.jpg',
    answers: ['Юпитер', 'Уран', 'Венера', 'Нептун'],
    correctIndex: 0,
    explanation: 'У Юпитера - 63\nУ Урана - 27\nУ Венеры - нет спутников\nУ Нептуна - 13',
    topicId: 14,
    subtopicId: 300,
  },
];
```

#### Пример фикстуры `fixtures/levelIcons.ts`

```ts
/** Все доступные иконки уровня (из user.htm — 51 символ) */
export const levelIcons: string[] = [
  '\u2680','\u2681','\u2682','\u2683','\u2684','\u2685', // ⚀⚁⚂⚃⚄⚅ (кости)
  '\u2660','\u2665','\u2663','\u2666',                     // ♠♥♣♦
  '\u2654','\u2655','\u2656','\u2657','\u2658','\u2659',  // ♔♕♖♗♘♙
  '\u265A','\u265B','\u265C','\u265D','\u265E','\u265F',  // ♚♛♜♝♞♟
  '\u2690','\u2691','\u2692','\u2693','\u2694','\u2695',  // ⚐⚑⚒⚓⚔⚕
  '\u2696','\u2697','\u2698','\u2699','\u269A',           // ⚖⚗⚘⚙⚚
  '\u2605','\u262D','\u2620','\u269B','\u2606','\u263C',  // ★☭☠⚛☆☼
  '\u26A1','\u25CF','\u2624','\u2721','\u263A','\u2622',  // ⚡●☤✡☺☢
  '\u266B','\u266A','\u2669','\u266F','\u266E','\u266D',  // ♫♪♩♯♮♭
  '\u266C','\u2708','\u2642','\u2640',                     // ♬✈♂♀
  '\u267F','\u267B','\u2671','\u2670',                     // ♿♻♱♰
  '\u271D','\u2660','\u271F','\u2720','\u2721','\u2731',  // ✝✟✠✡✱
  '\u2744','\u2603','\u2606','\u262E','\u2660',           // ❄☃☆☮
];
```

### 1.6 Cosmos — структура fixtures

Каждый компонент получает `.fixture.tsx` с отрисовкой всех вариантов на одной странице, обёрнутой в `FixtureLayout`.

**Пример `AnswerOption.fixture.tsx`:**

```tsx
import { FixtureLayout } from '../../organisms/FixtureLayout'
import { AnswerOption } from './AnswerOption'

export default function AnswerOptionFixture() {
  return (
    <FixtureLayout title="AnswerOption">
      <h3>Idle</h3>
      <AnswerOption number={1} text="Марс" onClick={() => {}} />
      <h3>Correct</h3>
      <AnswerOption number={1} text="Марс" state="correct" />
      <h3>Wrong</h3>
      <AnswerOption number={2} text="Нептун" state="wrong" />
      <h3>Long Text</h3>
      <AnswerOption number={1} text="Обогнать учебный автомобиль..." onClick={() => {}} />
    </FixtureLayout>
  )
}
```

**Пример `GameBoard.fixture.tsx`:**

```tsx
import { FixtureLayout } from './FixtureLayout'
import { GameBoard } from './GameBoard'
import { mockQuestions } from '../../mocks/fixtures/questions'

export default function GameBoardFixture() {
  return (
    <FixtureLayout title="GameBoard" nav="game">
      <GameBoard
        questions={mockQuestions.slice(0, 10)}
        onFinish={(results) => console.log('Game finished', results)}
      />
    </FixtureLayout>
  )
}
```

### 1.7 Порядок разработки компонентов (приоритет)

1. **Настройка проекта** — Vite, SCSS, переменные, миксины, reset ✓
2. **Atoms** — 16 компонентов ✓
3. **Molecules** — 18 компонентов ✓
4. **Organisms** — Layout, Header, Sidebar, GameBoard, NewGameForm, GameResults, UserProfile, NewQuestionForm, AuthForm ← текущий этап
5. **Страницы** — сборка роутов с Organisms
6. **Бэкенд + интеграция** — замена моков на API

### 1.8 Интеграция MSW (для бэкенда)

MSW будет использоваться на этапе разработки organisms для моков API, пока бэкенд не готов.

### 1.9 Команды

```bash
npm run dev          # Vite dev server (SPA)
npm run cosmos       # React Cosmos dev server (port 6006)
npm run cosmos:build # Cosmos static export
npm run build        # Production build
npm run lint         # Oxlint
```

---

## Пункт 2: Бэкенд (Express + SQLite + JWT)

### 2.1 Структура проекта

```
packages/backend/
├── src/
│   ├── index.ts              # Точка входа, запуск сервера
│   ├── app.ts                # Express app, middleware, routes
│   ├── db/
│   │   ├── connection.ts     # SQLite-подключение (better-sqlite3)
│   │   ├── schema.ts         # Создание таблиц (миграция)
│   │   └── seed.ts           # Начальные данные (опционально)
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.routes.ts   # POST /register, /login, /refresh, GET /me
│   │       ├── auth.service.ts  # Бизнес-логика (hash, verify, tokens)
│   │       ├── auth.schema.ts   # Zod-схемы валидации
│   │       └── auth.types.ts    # Типы User, TokenPayload
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT verify + attach user to req
│   │   ├── error.middleware.ts  # Глобальный обработчик ошибок
│   │   └── validate.middleware.ts # Zod-валидация body/query/params
│   └── lib/
│       ├── jwt.ts               # signAccessToken, signRefreshToken, verify
│       ├── password.ts          # hashPassword, comparePassword
│       └── env.ts               # Переменные окружения
├── tsconfig.json
├── package.json
└── .env                         # JWT_SECRET, PORT, etc.
```

### 2.1.1 Зависимости

```json
{
  "dependencies": {
    "express": "^4.x",
    "better-sqlite3": "^11.x",
    "jsonwebtoken": "^9.x",
    "bcryptjs": "^2.x",
    "zod": "^3.x",
    "cors": "^2.x",
    "dotenv": "^16.x"
  },
  "devDependencies": {
    "@types/express": "^4.x",
    "@types/better-sqlite3": "^7.x",
    "@types/jsonwebtoken": "^9.x",
    "@types/bcryptjs": "^2.x",
    "@types/cors": "^2.x",
    "typescript": "~5.x",
    "tsx": "^4.x"
  }
}
```

### 2.1.2 Таблица users

```sql
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  login       TEXT    NOT NULL UNIQUE,
  email       TEXT    NOT NULL UNIQUE,
  password    TEXT    NOT NULL,   -- bcrypt hash
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
```

### 2.1.3 API-эндпоинты (auth)

| Метод | Путь | Описание | Авторизация |
|-------|------|----------|-------------|
| `POST` | `/api/auth/register` | Регистрация | Нет |
| `POST` | `/api/auth/login` | Вход (возвращает access + refresh) | Нет |
| `POST` | `/api/auth/refresh` | Обновить access-токен по refresh | Нет (нужен refresh token в теле) |
| `GET` | `/api/auth/me` | Получить текущего пользователя | Bearer access_token |

### 2.1.4 Тело запросов/ответов

**POST /api/auth/register**
```json
// Request
{ "login": "user123", "email": "user@mail.ru", "password": "secret123" }
// Response 201
{ "id": 1, "login": "user123", "email": "user@mail.ru", "nickname": "user123", "level": 1, "icon": "♙" }
// Response 409
{ "error": "LOGIN_EXISTS" }
```

**POST /api/auth/login**
```json
// Request
{ "login": "user123", "password": "secret123" }
// Response 200
{
  "accessToken": "eyJ...",
  "refreshToken": "dGhp...",
  "user": { "id": 1, "login": "user123", "email": "user@mail.ru", "nickname": "CocaineTeddyBear", "level": 1, "icon": "♙" }
}
// Response 401
{ "error": "INVALID_CREDENTIALS" }
```

**POST /api/auth/refresh**
```json
// Request
{ "refreshToken": "dGhp..." }
// Response 200
{ "accessToken": "eyJ...", "refreshToken": "dGhp..." }
// Response 401
{ "error": "INVALID_TOKEN" }
```

**GET /api/auth/me**
```
Headers: Authorization: Bearer eyJ...
// Response 200
{ "id": 1, "login": "user123", "email": "user@mail.ru", "nickname": "CocaineTeddyBear", "level": 1, "icon": "♙" }
// Response 401
{ "error": "UNAUTHORIZED" }
```

### 2.1.5 JWT-стратегия

- **Access token**: 15 минут, в payload `{ userId, type: 'access' }`
- **Refresh token**: 30 дней, в payload `{ userId, type: 'refresh' }`, хранится в БД
- Access через заголовок `Authorization: Bearer <token>`
- Refresh через тело запроса

### 2.1.6 Middleware

```
app.use(cors())           → CORS для localhost:5173
app.use(express.json())   → парсинг JSON
auth.middleware.ts        → проверка JWT, req.user = { id, login, ... }
validate.middleware.ts    → Zod-валидация
error.middleware.ts       → try/catch → JSON-ответ с ошибкой
```

### 2.1.7 Порядок реализации

1. **Инициализация проекта**: `npm init`, `tsconfig.json`, зависимости
2. **db/connection.ts + schema.ts**: подключение к SQLite, создание таблиц
3. **lib/password.ts + lib/jwt.ts**: хеширование, JWT-утилиты
4. **modules/auth/auth.service.ts**: register, login, refresh, getMe
5. **modules/auth/auth.schema.ts**: Zod-валидация
6. **modules/auth/auth.routes.ts**: Express-роуты
7. **middleware/**: auth, validate, error
8. **app.ts + index.ts**: сборка приложения, запуск сервера
9. **Тестирование**: curl/Postman → register → login → me → refresh

---

## Пункт 3: Интеграция и развертывание — будет позже

_TBD._

---

## Текущий статус

- [x] Анализ legacy-кода
- [x] **Пункт 1: Библиотека компонентов**
  - [x] 1.1 Инициализация Vite + React Cosmos + SCSS
  - [x] 1.2 Atoms (16 компонентов)
  - [x] 1.3 Molecules (18 компонентов)
  - [x] 1.4 Organisms (Layout, GameBoard, TopicList, NewGameForm, GameResults, UserProfile, NewQuestionForm, AuthForm, Sidebar — 9 реализовано)
  - [x] 1.5 Templates + Страницы (App.tsx: NewGameForm → GameBoard → GameResults, полный игровой флоу)
  - [x] 1.6 Исправления после аудита (31/31)
  - [x] 1.7 Исправления после второго аудита (27/27: баги, missing, design, unused, chains)
  - [x] 1.8 Страница добавления вопросов (bulk-парсинг, returnUrl, auth guard)
- [ ] **Пункт 2: Бэкенд** (Express + SQLite + JWT) — API готово, нужна доработка
- [ ] **Пункт 3: Развертывание**

### Итого реализовано

| Уровень | Компонентов | Файлов | Статус |
|---------|------------|--------|--------|
| Atoms | 16 | 64 (.tsx + .scss + .fixture + index) | ✓ |
| Molecules | 18 | 72 | ✓ |
| Organisms | 10 | 40 | ✓ |
| Mocks | 3 fixtures | 3 | ✓ |
| Lib | 2 (navItems, types) | 2 | ✓ |
| App | 1 (полный флоу) | 1 | ✓ |
| **Всего** | **46 компонентов** | **~178 файлов** | ✓ |

### Ключевые достижения

- **Полный игровой флоу**: NewGameForm (выбор тем/времени) → GameBoard (игра) → GameResults (результаты) → новая игра
- **Дизайн-система**: 16 атомов + 18 молекул + 10 организмов, всё на SCSS Modules
- **Cosmos**: 34 fixture-файла с изолированным просмотром каждого компонента
- **Toast-система**: очередь, анимации, стек, авто-скрытие
- **Игровая механика**: таймер, подсчёт очков, flash-анимация ответов, correct/wrong/muted состояния
- **Регистрация/Авторизация**: JWT, bcrypt, восстановление пароля, returnUrl
- **Добавление вопросов**: bulk-парсинг (формат с *), категории/темы из БД
- **Монорепозиторий**: npm workspaces, `npm run dev` запускает оба проекта

### Что отложено (не блокирует)

- forwardRef у 8 атомов (низкий приоритет)
- TopicCard two-way showAll (нужен onCollapse callback)
- TimerDigit aria-live для скринридеров
- i18n (все строки на русском, хардкод)
- TanStack Router / Query / Store (установлены, не используются — этап бэкенда)

---

## Пункт 1.6: Исправления после полного аудита

**Аудит выявил 31 проблему.** План исправлений по приоритетам:

### 🔴 CRITICAL (4)

| # | Проблема | Файлы | Исправление |
|---|----------|-------|-------------|
| C1 | **Сломанный flow ответа**: GameBoard.handleAnswer никогда не вызывается. AnswerGrid не передаёт selectedIndex в GameBoard. Счёт correctCount/refs не обновляется. Игра не работает. | `GameBoard.tsx`, `AnswerGrid.tsx` | Убрать AnswerGrid.onComplete → вместо этого AnswerGrid принимает `onAnswer(index)` колбэк и вызывает его до показа тоста. GameBoard.handleAnswer должен получать индекс ответа. |
| C2 | **Двойной ToastContainer**: GameBoard и AnswerGrid оба вызывают useToast() → два стека тостов. | `GameBoard.tsx`, `AnswerGrid.tsx` | Убрать useToast из AnswerGrid. AnswerGrid получает `onAnswer(index)` и отдаёт управление наверх. Toast показывает GameBoard. |
| C3 | **Удалить MegabrainLayout.tsx** (446 строк дубликата) | `organisms/MegabrainLayout.tsx`, `.fixture.tsx` | Удалить. Вся функциональность покрыта Layout + Organisms. |
| C4 | **Удалить atoms/Toast/** (пустая директория) | `atoms/Toast/` | Удалить. Toast в molecules. |

### 🟠 HIGH (8)

| # | Проблема | Исправление |
|---|----------|-------------|
| H1 | Header и Sidebar — пустые директории | Реализовать как organisms, использующие атомы/молекулы |
| H2 | Layout.tsx и FixtureLayout.tsx — дубликат структуры | FixtureLayout = обёртка над Layout |
| H3 | navItems массив в 3 местах | Вынести в `lib/navItems.ts` |
| H4 | Организмы используют inline styles, а не SCSS модули | GameBoard, GameResults, NewGameForm, TopicList → SCSS модули |
| H5 | Tooltip — module-level singleton (apiRef) | Переписать на React Context |
| H6 | Моки пустые | Создать `src/mocks/fixtures/`: topics.ts, questions.ts, levelIcons.ts, gameResults.ts |
| H7 | SearchForm не использует Input атом | Заменить raw `<input>` на `<Input>` |
| H8 | TimeSettingRow: hint?: string, а передаётся JSX | Поменять тип на `ReactNode` |

### 🟡 MEDIUM (10)

| # | Проблема | Исправление |
|---|----------|-------------|
| M1 | GameQuitConfirm: onConfirm в GameBoard вызывает toggle вместо реального quit | Разделить onConfirm и onCancel в GameBoard |
| M2 | Tabs: один tabpanel для всех вкладок | Каждая вкладка — свой tabpanel с aria-labelledby |
| M3 | InlineEdit: упрощён до text-only | Добавить editType: text/textarea/select/password/radio |
| M4 | TopicCard: «показать все» работает только в одну сторону | Добавить collapse обратно |
| M5 | NewQuestionForm не использует topics проп | Добавить TopicList в форму |
| M6 | NewQuestionForm: Input type="file" вместо FileInput атома | Заменить на FileInput |
| M7 | UserProfile: InlineEdit.onSave = () => {} (no-op) | Добавить useState для полей |
| M8 | UserProfile: levelIcons хардкодены | Импортировать из mocks/fixtures/levelIcons.ts |
| M9 | AnswerGrid: «сыграть ещё» показывается в GameBoard flow | Скрывать кнопку когда onAnswer передан |
| M10 | forwardRef отсутствует у 8 атомов | Добавить везде, где уместно |

### 🟢 LOW (9)

| # | Проблема | Исправление |
|---|----------|-------------|
| L1 | AnswerResultItem: «Источник Википедия» всегда | Передавать sourceLabel пропом |
| L2 | TopicCard: <a href="#"> вместо <button> в profile mode | Заменить на button |
| L3 | GameBoard: <div className="clear"> — legacy | Убрать, заменить на flex/grid |
| L4 | Overlay: aria-hidden="true" на интерактивном элементе | Убрать aria-hidden |
| L5 | TimerDigit: aria-hidden скрывает от скринридеров | Timer должен предоставлять aria-live текст |
| L6 | SearchForm: нет контролируемого режима | Добавить value/onChange пропы |
| L7 | AnswerGrid: key={resetKey} — антипаттерн | Использовать нормальный сброс стейта |
| L8 | App.tsx — raw HTML, не использует компоненты | Заменить на роуты с Layout |
| L9 | InlineEdit: два независимых if вместо else if | Исправить на else if |

### Недостающие компоненты (добавить в 1.4)

> По итогам аудита выявлены компоненты, не попавшие в первоначальный план:

| # | Компонент | Уровень | Описание |
|---|-----------|---------|----------|
| 1 | `Header` | organisms | Логотип + AuthLinks. **Директория есть, пустая.** |
| 2 | `Sidebar` | organisms | Навигация + Copyrights. **Директория есть, пустая.** |
| 3 | `navItems` | lib/ | Константа с 5 пунктами навигации. Дублируется в 3 местах. |
| 4 | `QuestionCard` | molecules | Карточка вопроса (текст + картинка). Сейчас рендерится инлайн в GameBoard. |
| 5 | `mocks/fixtures/topics.ts` | mocks | Полный список тем и подтем (6 тем, ~80 подтем). |
| 6 | `mocks/fixtures/questions.ts` | mocks | Массив вопросов с ответами. |
| 7 | `mocks/fixtures/levelIcons.ts` | mocks | 51 иконка уровня. Сейчас хардкод в UserProfile. |
| 8 | `mocks/fixtures/gameResults.ts` | mocks | Мок-результаты игры. |
| 9 | `mocks/fixtures/gameConfig.ts` | mocks | Настройки новой игры. |

---

## Пункт 1.7: Исправления после второго аудита (глубокий анализ)

**Второй аудит выявил ещё 27 проблем — критические баги, неиспользуемый код, незавершённые цепочки.**

### 🔴 БАГИ (7)

| # | Серьёзность | Проблема | Где | Исправление |
|---|-----------|----------|-----|-------------|
| B1 | CRITICAL | **GameQuitConfirm**: триггер-кнопка вызывает `onConfirm` напрямую = игра заканчивается мгновенно, без диалога подтверждения | `GameQuitConfirm.tsx:20`, `GameBoard.tsx:92` | Разделить пропсы: `onRequestConfirm` (триггер) / `onConfirm` (кнопка «да»). GameBoard: `onRequestConfirm={() => setQuitVisible(true)}`, `onConfirm={handleQuit}` |
| B2 | HIGH | **Stale closure** в `handleAnswer`: setTimeout захватывает `correctCount`/`timerCs` из замыкания. При каждом тике таймера useCallback пересоздаётся — гонка | `GameBoard.tsx:57-69` | Заменить setTimeout на `useEffect` по `paused` флагу или использовать ref для `correctCount`/`timerCs` |
| B3 | HIGH | **Breadcrumbs без позиционирования**: компонент использует CSS Module (`.breadcrumbs`), а позиционирование (`left: 241px`) — в global.scss (`.b-breadcrumbs`) | `Breadcrumbs.tsx`, `global.scss:111-127` | Добавить позиционирование в `Breadcrumbs.module.scss` или применить глобальный класс `b-breadcrumbs` |
| B4 | HIGH | **Вёрстка сломана**: `.l-content::before` рисует полосу `content_bg_top.jpg` высотой 8px. Весь контент съезжает: `.l-content` имеет `left: 216px`, Breadcrumbs — `left: 241px`. Без глобального класса позиционирование не работает | `global.scss:44-57`, все организмы | Layout organism должен явно задавать позиционирование через свой SCSS-модуль, не полагаться на глобальные классы |
| B5 | MEDIUM | **Toast исчезает за 500ms до перехода**: autoHide=2000, а вопрос сменяется через 2500 | `GameBoard.tsx:54,69` | Синхронизировать: autoHide = 2300, setTimeout = 2500 |
| B6 | MEDIUM | **Плюрализация**: всегда «ответа» независимо от числа | `GameBoard.tsx:102` | Добавить функцию `pluralize(n, ['ответ','ответа','ответов'])` |
| B7 | MEDIUM | **Timer `direction` проп игнорируется** | `Timer.tsx:10,26` | Убрать проп или реализовать обратный отсчёт |

### 🟠 НЕДОСТАЮЩИЙ ФУНКЦИОНАЛ (7)

| # | Проблема | Исправление |
|---|----------|-------------|
| M1 | **NewGameForm: можно начать без тем** — валидации нет | Блокировать кнопку СТАРТ при `selectedIds.length === 0` + показать ошибку |
| M2 | **NewQuestionForm: subtopicIds всегда []** — нет UI выбора тем | Добавить TopicList в форму или хотя бы заглушку |
| M3 | **NewQuestionForm: нет ошибок валидации** | Показать ошибки на полях при пустом сабмите |
| M4 | **SearchForm в TopicList: нет onSearch** — поиск не работает | Добавить обработчик или убрать SearchForm если не нужен |
| M5 | **TooltipProvider не в App** — любой Tooltip крашнет | Обернуть App в TooltipProvider |
| M6 | **GameBoard: пустой массив questions → краш** | Добавить guard: `if (!question) return <div>Нет вопросов</div>` |
| M7 | **@tanstack/react-query и @tanstack/react-store установлены, но не используются** | Пока оставить (понадобятся на этапе бэкенда) |

### 🟡 ДИЗАЙН-ФЛОУ (5)

| # | Проблема | Исправление |
|---|----------|-------------|
| D1 | **Layout/Sidebar зависят от global.scss** — несамодостаточны | Перенести позиционирование в CSS Modules, оставить global.scss только для ресета и переменных |
| D2 | **Типы `Topic`/`Subtopic`/`Question` дублируются** в 3+ файлах | Создать `src/lib/types.ts` с общими типами |
| D3 | **Мёртвый CSS в global.scss**: `.b-breadcrumbs`, `.b-game-*`, `.b-topic` — не используются компонентами | Убрать или пометить как legacy |
| D4 | **GameQuitConfirm**: один проп `onConfirm` для двух разных действий | Разделить на `onRequest` + `onConfirm` |
| D5 | **Таблица стилей**: три подхода — SCSS Modules, global BEM, inline styles. Смешение | Привести всё к SCSS Modules |

### 🟢 НЕИСПОЛЬЗУЕМЫЕ АТОМЫ (5)

Атомы, которые полностью реализованы (TSX + SCSS + fixture) но НИГДЕ не используются молекулами или организмами:

| Атом | Почему не используется |
|------|----------------------|
| `Spinner` | Button рендерит свой inline-спиннер |
| `Badge` | Нигде не востребован (пока) |
| `Icon` | NavItems используют raw Unicode, никто не импортирует Icon |
| `CloseButton` | Toast рендерит свою inline-кнопку закрытия |
| `Overlay` | Нет модалок, которые бы его использовали |

**Решение:**
- `Spinner` → использовать в Button (заменить inline)
- `Badge` → оставить, пригодится в GameResults/UserProfile
- `Icon` → использовать в Sidebar вместо raw Unicode
- `CloseButton` → использовать в Toast и TopicList (modal)
- `Overlay` → оставить, пригодится для модалок

### 🟢 НЕЗАВЕРШЁННЫЕ ЦЕПОЧКИ (3)

| # | Проблема | Исправление |
|---|----------|-------------|
| C1 | `App.tsx`: onFinish → `alert()`. `GameResults` organism готов, но не подключен | Заменить alert на рендер GameResults (условный рендеринг по стейту) |
| C2 | `App.tsx`: сразу GameBoard, нет страницы выбора темы/времени | Добавить условный рендер: NewGameForm → GameBoard → GameResults |
| C3 | `AuthForm` готов, но не подключен (нет роутинга) | Отложить до этапа роутинга |

---

## Сводка: что делать прямо сейчас

**Фаза 1 — критические баги (30 мин):**
- B1: GameQuitConfirm разделить пропсы
- B2: Stale closure в GameBoard
- B3: Breadcrumbs позиционирование
- B4: Общий layout positioning
- B5: Toast timing

**Фаза 2 — недостающий функционал (20 мин):**
- M1: NewGameForm валидация
- M4: SearchForm onSearch или убрать
- M5: TooltipProvider в App
- M6: GameBoard empty guard

**Фаза 3 — дизайн-флоу (30 мин):**
- D1-D3: Вынести layout-стили в модули, типы в lib/types.ts
- D4: GameQuitConfirm пропсы
- Неиспользуемые атомы: подключить Icon в Sidebar, CloseButton в Toast/TopicList

**Фаза 4 — цепочки приложения (30 мин):**
- C1-C2: App.tsx — полный флоу: NewGameForm → GameBoard → GameResults
- C3: отложить
