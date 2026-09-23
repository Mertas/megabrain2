/// <reference types="cypress" />

describe('PvP', () => {
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
      cy.visit('/pvp', {
        onBeforeLoad(win) {
          win.localStorage.setItem('accessToken', res.body.accessToken)
          win.localStorage.setItem('refreshToken', res.body.refreshToken)
          win.localStorage.setItem('user', JSON.stringify(res.body.user))
        },
      })
    })
  })

  it('renders the PvP setup page', () => {
    cy.get('[data-testid="hero-title"]').should('contain', 'PvP')
    cy.contains('button', 'Искать соперника').should('be.disabled')
  })

  it('enables join button after selecting topics', () => {
    cy.get('[data-testid="select-all-topics"]').first().click()
    cy.contains('button', 'Искать соперника').should('not.be.disabled')
  })

  it('enters queue and cancels back to lobby', () => {
    cy.get('[data-testid="select-all-topics"]').first().click()
    cy.contains('button', 'Искать соперника').click()
    cy.contains('Поиск соперника...', { timeout: 5000 }).should('be.visible')
    cy.contains('button', 'Отмена').should('be.visible').click()
    cy.contains('button', 'Искать соперника').should('be.visible')
  })

  it('allows changing question count and time settings', () => {
    cy.get('[data-testid="select-all-topics"]').first().click()
    cy.contains('Вопросов').should('exist')
    cy.contains('Таймаут').should('exist')
    cy.contains('Тема должна совпадать').should('exist')
  })
})
