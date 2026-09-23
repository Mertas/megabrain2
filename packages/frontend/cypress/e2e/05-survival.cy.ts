/// <reference types="cypress" />

describe('Survival', () => {
  let users: Array<{ login: string; password: string }>

  before(() => {
    cy.fixture('test-users').then((data) => { users = data })
  })

  beforeEach(() => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { login: users[0].login, password: users[0].password },
      failOnStatusCode: false,
    }).then((res) => {
      cy.visit('/survival', {
        onBeforeLoad(win) {
          win.localStorage.setItem('accessToken', res.body.accessToken)
          win.localStorage.setItem('refreshToken', res.body.refreshToken)
          win.localStorage.setItem('user', JSON.stringify(res.body.user))
        },
      })
    })
  })

  it('renders the Survival setup page', () => {
    cy.get('[data-testid="hero-title"]').should('contain', 'Режим выживания')
    cy.contains('button', 'Начать выживание').should('be.disabled')
    cy.contains('button', 'Таблица лидеров').should('exist')
  })

  it('enables start after selecting topics', () => {
    cy.get('[data-testid="select-all-topics"]').first().click()
    cy.contains('button', 'Начать выживание').should('not.be.disabled')
  })

  it('plays survival game to completion and shows results', () => {
    cy.intercept('/api/survival/answer').as('answerApi')

    cy.get('[data-testid="select-all-topics"]').first().click()
    cy.contains('button', 'Начать выживание').click()

    // Wait for the game to load and render
    cy.get('[data-testid="answer-option"]', { timeout: 15000 }).should('have.length.at.least', 2)

    // Answer questions up to 25 — 3 wrong answers end the game
    // Use recursion so we can stop when the game ends
    function answerQuestion(round: number): void {
      if (round >= 25) return

      cy.get('[data-testid="answer-option"]', { timeout: 10000 }).first().click()
      cy.wait('@answerApi', { timeout: 15000 })
      cy.wait(2500)

      cy.get('body').then(($body) => {
        const isGameOver = $body.find('h1').text().includes('Игра окончена')
        if (!isGameOver) {
          answerQuestion(round + 1)
        }
      })
    }

    answerQuestion(0)

    // Verify results screen
    cy.get('h1', { timeout: 15000 }).should('contain', 'Игра окончена')
    cy.contains('Очки выживания').should('exist')
    cy.contains('Макс. стрик').should('exist')
    cy.contains('Точность').should('exist')
    cy.contains('Правильных ответов:').should('exist')
    cy.contains('Ошибок:').should('exist')
    cy.contains('Достигнутая сложность:').should('exist')
    cy.contains('button', 'Играть снова').should('exist')
    cy.contains('button', 'Таблица лидеров').should('exist')
  })
})
