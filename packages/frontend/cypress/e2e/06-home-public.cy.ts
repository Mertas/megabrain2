/// <reference types="cypress" />

describe('Home (Public / Non-logged-in)', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('shows a public question when not logged in', () => {
    cy.get('[data-testid="answer-option"]', { timeout: 10000 }).should('have.length', 4)
    cy.contains('·').should('exist') // category separator
  })

  it('shows the login form on the page', () => {
    cy.contains('Войдите, чтобы сохранять прогресс').should('exist')
    cy.contains('button', 'Войти').should('exist')
    cy.contains('Зарегистрироваться').should('exist')
    cy.contains('Забыли пароль?').should('exist')
  })

  it('allows answering a public question', () => {
    cy.get('[data-testid="answer-option"]', { timeout: 10000 }).first().as('firstAnswer')
    cy.get('@firstAnswer').click()

    // Wait for answer to be processed — feedback appears
    cy.contains('button', 'Следующий вопрос', { timeout: 10000 }).should('be.visible')
  })
})
