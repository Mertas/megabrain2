# Cypress E2E-тесты

> ✅ **Статус: Реализовано** (2026-07-07)

---

## Обзор

Визуальные E2E-тесты с реальным браузером. Проверяют полные пользовательские сценарии: от регистрации до завершения игры. Используется **Cypress** — самый популярный инструмент для визуального тестирования.

Бэкенд должен быть запущен (`npm run dev -w packages/backend` на порту 3042), фронтенд — через Vite dev server (`npm run dev` на порту 5142).

---

## Установка и конфигурация

### 1. Установить Cypress

```bash
cd packages/frontend
npm install -D cypress
```

### 2. cypress.config.ts

```typescript
// packages/frontend/cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5142',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    retries: { runMode: 1 },
  },
})
```

### 3. Команды поддержки

```typescript
// packages/frontend/cypress/support/e2e.ts
// Кастомные Cypress-команды для проекта

Cypress.Commands.add('register', (login: string, email: string, password: string) => {
  cy.visit('/register')
  cy.get('input[placeholder*="огин"]').type(login)
  cy.get('input[placeholder*="email"]').type(email)
  cy.get('input[placeholder*="ароль"]').first().type(password)
  cy.get('button').contains('Зарегистрироваться').click()
  cy.url().should('eq', Cypress.config().baseUrl + '/')
})

Cypress.Commands.add('login', (login: string, password: string) => {
  cy.visit('/login')
  cy.get('input[placeholder*="огин"]').type(login)
  cy.get('input[placeholder*="ароль"]').type(password)
  cy.get('button').contains('Войти').click()
  cy.url().should('eq', Cypress.config().baseUrl + '/')
})

Cypress.Commands.add('logout', () => {
  cy.get('a').contains('выйти').click()
})
```

### 4. Добавить скрипты в package.json

```json
"scripts": {
  "test:e2e": "cypress open",
  "test:e2e:run": "cypress run"
}
```

---

## Тест 1: Регистрация нового пользователя

**Файл:** `cypress/e2e/01-auth.cy.ts`

### Сценарий: успешная регистрация

```typescript
describe('Регистрация', () => {
  const testUser = {
    login: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@megabrain.test`,
    password: 'TestPass123',
  }

  it('регистрирует нового пользователя и перенаправляет на главную', () => {
    cy.visit('/register')

    // Проверяем заголовок страницы
    cy.contains('h1', 'Регистрация').should('be.visible')
    // Или через Text-компонент:
    cy.contains('Регистрация').should('be.visible')

    // Заполняем форму
    cy.get('input[placeholder*="огин"]').type(testUser.login)
    cy.get('input[placeholder*="email"]').type(testUser.email)
    cy.get('input[type="password"]').first().type(testUser.password)

    // Проверяем, что индикатор сложности пароля появился
    // (StrengthBar рендерится после 6+ символов)
    cy.contains(/Слабый|Средний|Хороший|Отличный/).should('be.visible')

    // Отправляем форму
    cy.get('button').contains('Зарегистрироваться').click()

    // После успешной регистрации — редирект на /
    cy.url().should('eq', Cypress.config().baseUrl + '/')

    // Проверяем, что пользователь залогинен (никнейм в шапке)
    cy.get('.b-user-auth').should('contain', testUser.login)

    // Проверяем, что форма новой игры отображается
    cy.contains('Новая игра').should('be.visible')
  })

  it('показывает ошибку при пустых полях', () => {
    cy.visit('/register')
    cy.get('button').contains('Зарегистрироваться').click()
    // Zod-валидация на сервере: должны быть сообщения об ошибках
    cy.contains(/обязатель|неверн|ошибк/i).should('exist')
  })
})
```

### Шаги (для каждого теста):

1. Перейти на `/register`
2. Заполнить поля: логин, email, пароль
3. Проверить индикатор сложности пароля (StrengthBar)
4. Нажать «Зарегистрироваться»
5. Проверить редирект на `/`
6. Проверить, что никнейм отображается в шапке
7. Проверить, что форма «Новая игра» видна

---

## Тест 2: Авторизация

**Файл:** `cypress/e2e/01-auth.cy.ts`

### Сценарий: успешный вход

```typescript
describe('Авторизация', () => {
  it('входит под существующим пользователем', () => {
    // Используем seeded-пользователя или созданного ранее
    cy.visit('/login')

    cy.contains('Вход').should('be.visible')

    cy.get('input[placeholder*="огин"]').type('admin')
    cy.get('input[placeholder*="ароль"]').type('admin123')

    cy.get('button').contains('Войти').click()

    cy.url().should('eq', Cypress.config().baseUrl + '/')
    cy.get('.b-user-auth').should('contain', 'admin')
  })

  it('показывает ошибку при неверном пароле', () => {
    cy.visit('/login')
    cy.get('input[placeholder*="огин"]').type('admin')
    cy.get('input[placeholder*="ароль"]').type('wrongpass')
    cy.get('button').contains('Войти').click()
    cy.contains(/неверн|ошибк/i, { timeout: 5000 }).should('be.visible')
  })
})
```

### Шаги:

1. Перейти на `/login`
2. Заполнить поля: логин, пароль
3. Нажать «Войти»
4. Проверить редирект на `/`
5. Проверить, что никнейм в шапке совпадает
6. (Негативный) проверить сообщение об ошибке при неверном пароле

---

## Тест 3: Соло-игра (10 вопросов, 5 случайных тем)

**Файл:** `cypress/e2e/02-solo-game.cy.ts`

### Предусловие

Пользователь должен быть залогинен. Используем `cy.login()` из команд поддержки.

### Сценарий: полный цикл игры

```typescript
describe('Соло-игра', () => {
  before(() => {
    cy.login('admin', 'admin123')
  })

  it('проходит игру из 10 вопросов с 5 случайными темами', () => {
    cy.visit('/')

    // 1. Выбрать 5 случайных тем
    // Нажать на первые 5 категорий (каждая раскроет подтемы)
    // TopicList рендерит TopicCard для каждой категории
    cy.get('[class*="TopicCard"]').should('have.length.at.least', 5)

    // Выбрать все подтемы в 5 категориях (через кнопку "выбрать все" или индивидуально)
    // У каждой категории есть кнопка выбора всех подтем
    cy.get('button').contains(/выбрать все/i).each(($btn, idx) => {
      if (idx < 5) cy.wrap($btn).click()
    })

    // 2. Настроить время: на вопрос, 30 секунд
    // TimeSettingRow: radio "На вопрос" + select с опциями времени
    cy.get('input[type="radio"][name="timing"]').first().check()
    cy.get('select').last().select('30')

    // 3. Выбрать 10 вопросов
    cy.get('select').first().select('10')

    // 4. Нажать «Начать игру»
    cy.get('button').contains('Начать игру').click()

    // URL должен измениться на /game
    cy.url().should('include', '/game')

    // 5. Ответить на 10 вопросов
    for (let i = 0; i < 10; i++) {
      // Дождаться появления вопроса
      cy.get('[class*="question"]', { timeout: 5000 }).should('be.visible')

      // Нажать на первый вариант ответа (всегда есть 4 варианта)
      // AnswerOption — это div с атрибутом отвечающим за ответ
      cy.get('[class*="AnswerOption"]').first().click()

      // Дождаться показа результата (correct/wrong + note + 2.5s пауза)
      // Проверяем, что появился индикатор правильности
      cy.get('[class*="note"], [class*="correct"], [class*="wrong"]', { timeout: 5000 }).should('exist')

      // Ждём автопереход к следующему вопросу (2.5s + запас)
      cy.wait(3000)
    }

    // 6. Проверить страницу результатов
    cy.contains('Результаты игры').should('be.visible')
    cy.contains(/ответили верно/i).should('be.visible')

    // Проверить, что показана статистика
    cy.contains(/вопросов/).should('be.visible')
    cy.contains(/очков/).should('be.visible')

    // Проверить кнопку «Новая игра»
    cy.contains('Новая игра').should('be.visible')
  })
})
```

### Шаги:

1. Залогиниться
2. Выбрать 5 категорий тем (через кнопки «выбрать все»)
3. Настроить: «На вопрос», 30 секунд
4. Выбрать: 10 вопросов
5. Нажать «Начать игру»
6. В цикле 10 раз:
   - Дождаться вопроса
   - Кликнуть на вариант ответа
   - Дождаться показа результата
   - Дождаться автоперехода
7. Проверить страницу результатов
8. Проверить наличие статистики и кнопки возврата

---

## Селекторы для стабильности

Текущие компоненты не имеют `data-testid`. Рекомендуется добавить их в ключевые места:

| Компонент | data-testid |
|-----------|-------------|
| Форма логина | `auth-login` |
| Форма регистрации | `auth-register` |
| Кнопка «Начать игру» | `solo-start` |
| Кнопка поиска PvP | `pvp-join` |
| Карточка темы (TopicCard) | `topic-card` |
| Вариант ответа (AnswerOption) | `answer-{index}` |
| Таймер | `game-timer` |
| Индикатор стрика | `survival-streak` |

Без `data-testid` селекторы строятся на классах и тексте:
- Кнопки: `cy.get('button').contains('Текст')`
- Поля ввода: `cy.get('input[placeholder*="фрагмент"]')`
- Select: `cy.get('select')`
- Компоненты: `cy.get('[class*="ComponentName"]')`

---

## Файловая структура

```
packages/frontend/
├── cypress.config.ts
├── cypress/
│   ├── support/
│   │   └── e2e.ts              ← кастомные команды
│   └── e2e/
│       ├── 01-auth.cy.ts       ← регистрация + авторизация
│       └── 02-solo-game.cy.ts  ← соло-игра
└── package.json                ← + скрипты test:e2e, test:e2e:run
```

---

## Запуск

```bash
# Терминал 1 — бэкенд
npm run dev -w packages/backend

# Терминал 2 — фронтенд
npm run dev

# Терминал 3 — Cypress в интерактивном режиме (браузер видно)
cd packages/frontend
npm run test:e2e

# Или в headless-режиме:
npm run test:e2e:run
```

---

## Этапы реализации

1. [ ] Установить Cypress: `npm install -D cypress`
2. [ ] Создать `cypress.config.ts`
3. [ ] Создать `cypress/support/e2e.ts` с кастомными командами
4. [ ] Добавить скрипты в `package.json`
5. [ ] Написать тест регистрации (`01-auth.cy.ts`)
6. [ ] Написать тест авторизации (`01-auth.cy.ts`)
7. [ ] Написать тест соло-игры (`02-solo-game.cy.ts`)
8. [ ] (Опционально) Добавить `data-testid` в ключевые компоненты
9. [ ] Запустить и отладить
