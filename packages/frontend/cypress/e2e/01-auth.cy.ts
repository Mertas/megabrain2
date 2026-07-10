/// <reference types="cypress" />

interface TestUser {
  login: string
  password: string
}

describe('Регистрация и авторизация', () => {
  it('регистрирует нового пользователя и переходит на главную', () => {
    const user = {
      login: `ft_${Date.now().toString(36)}`,
      email: `ft_${Date.now().toString(36)}@example.com`,
      password: 'TestPass1',
    }

    cy.visit('/register')
    cy.get('[data-testid="auth-login"]').should('be.visible')

    cy.get('[data-testid="auth-login"]').type(user.login)
    cy.get('[data-testid="auth-email"]').type(user.email)
    cy.get('[data-testid="auth-password"]').type(user.password)

    cy.contains(/Слабый|Средний|Хороший|Отличный/, { timeout: 5000 }).should('be.visible')

    cy.get('[data-testid="auth-submit"]').click()

    cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/')
    cy.get('.b-user-auth').should('contain', user.login)
  })

  it('показывает ошибку при пустых полях', () => {
    cy.visit('/register')
    cy.get('[data-testid="auth-submit"]').click()
    cy.contains(/должен|ошибк/i, { timeout: 5000 }).should('be.visible')
  })

  it('входит под тестовым пользователем', () => {
    cy.fixture('test-users').then((users: TestUser[]) => {
      cy.visit('/login')
      cy.get('[data-testid="auth-login"]').should('be.visible')

      cy.get('[data-testid="auth-login"]').type(users[0].login)
      cy.get('[data-testid="auth-password"]').type(users[0].password)
      cy.get('[data-testid="auth-submit"]').click()

      cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/')
      cy.get('.b-user-auth').should('contain', users[0].login)
    })
  })

  it('показывает ошибку при неверном пароле', () => {
    cy.fixture('test-users').then((users: TestUser[]) => {
      cy.visit('/login')
      cy.get('[data-testid="auth-login"]').type(users[0].login)
      cy.get('[data-testid="auth-password"]').type('wrongpassword')
      cy.get('[data-testid="auth-submit"]').click()
      cy.contains(/неверн|ошибк|парол/i, { timeout: 8000 }).should('be.visible')
    })
  })
})
