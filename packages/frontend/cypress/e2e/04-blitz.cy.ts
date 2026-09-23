/// <reference types="cypress" />

describe('Blitz', () => {
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
      cy.visit('/blitz', {
        onBeforeLoad(win) {
          win.localStorage.setItem('accessToken', res.body.accessToken)
          win.localStorage.setItem('refreshToken', res.body.refreshToken)
          win.localStorage.setItem('user', JSON.stringify(res.body.user))
        },
      })
    })
  })

  it('renders the Blitz setup page', () => {
    cy.get('[data-testid="hero-title"]').should('exist')
    cy.contains('button', 'Искать соперника').should('be.disabled')
  })

  it('enables join button after selecting topics', () => {
    cy.get('[data-testid="select-all-topics"]').first().click()
    cy.contains('button', 'Искать соперника').should('not.be.disabled')
  })

  it('shows round and time config options', () => {
    cy.contains('Раунды').should('exist')
    cy.contains('Время на раунд').should('exist')
    cy.contains('Темы').should('exist')
  })

  it('enters queue and cancels back to setup', () => {
    cy.get('[data-testid="select-all-topics"]').first().click()
    cy.contains('button', 'Искать соперника').click()
    cy.contains('Поиск соперника...', { timeout: 5000 }).should('be.visible')
    cy.contains('button', 'Отмена').should('be.visible').click()
    cy.contains('button', 'Искать соперника').should('be.visible')
  })

  it('allows changing round count and time per round', () => {
    cy.get('select').eq(0).select('7')
    cy.get('select').eq(1).select('10')
    cy.get('[data-testid="select-all-topics"]').first().click()
    cy.contains('button', 'Искать соперника').should('not.be.disabled')
  })

  it('shows rules section', () => {
    cy.contains('Один вопрос на двоих').should('exist')
    cy.contains('Одна попытка на раунд').should('exist')
  })
})
