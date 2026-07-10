/// <reference types="cypress" />

interface TestUser {
  login: string
  password: string
}

describe('Соло-игра', () => {
  it('проходит игру из 10 вопросов с 5 случайными темами', () => {
    cy.fixture('test-users').then((users: TestUser[]) => {
      cy.request('POST', '/api/auth/login', {
        login: users[0].login,
        password: users[0].password,
      }).then((res) => {
        cy.visit('/', {
          onBeforeLoad(win) {
            win.localStorage.setItem('accessToken', res.body.accessToken)
            win.localStorage.setItem('refreshToken', res.body.refreshToken)
            win.localStorage.setItem('user', JSON.stringify(res.body.user))
          },
        })
      })
    })

    cy.get('[data-testid="hero-title"]', { timeout: 8000 }).should('contain', 'Новая игра')

    cy.get('[data-testid="select-all-topics"]').should('have.length.at.least', 5)
    for (let i = 0; i < 5; i++) {
      cy.get('[data-testid="select-all-topics"]').eq(i).click()
    }

    cy.get('input[type="radio"]').first().check()
    cy.get('[data-testid="time-select"]').first().select('30')
    cy.get('[data-testid="question-count"]').select('10')

    // Pick 3 random powerups (wait for them to load)
    cy.get('[data-testid="powerup-btn"]', { timeout: 8000 }).should('have.length.at.least', 3)
    cy.get('[data-testid="powerup-btn"]').first().click()
    cy.get('[data-testid="powerup-btn"]').eq(1).click()
    cy.get('[data-testid="powerup-btn"]').eq(2).click()

    cy.intercept('GET', '/api/topics/questions*').as('fetchQuestions')
    cy.get('[data-testid="solo-start"]').click()
    cy.wait('@fetchQuestions', { timeout: 10000 })
    cy.url().should('include', '/game')

    // Answer 10 questions — click first answer, wait for advance
    for (let i = 0; i < 10; i++) {
      cy.get('[data-testid="answer-option"]', { timeout: 10000 }).first().click()
      // Wait for result display + auto-advance (2.5s + buffer)
      cy.wait(3500)
    }

    cy.get('[data-testid="hero-title"]', { timeout: 8000 }).should('contain', 'Результаты')
  })
})
