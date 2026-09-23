/// <reference types="cypress" />

describe('Game Config', () => {
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
      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.setItem('accessToken', res.body.accessToken)
          win.localStorage.setItem('refreshToken', res.body.refreshToken)
          win.localStorage.setItem('user', JSON.stringify(res.body.user))
        },
      })
    })
  })

  it('shows the new game form', () => {
    cy.get('[data-testid="hero-title"]').should('contain', 'Новая игра')
    cy.get('[data-testid="question-count"]').should('exist')
    cy.get('[data-testid="solo-start"]').should('be.disabled')
  })

  it('allows selecting topics and changing settings', () => {
    cy.get('[data-testid="select-all-topics"]').first().click()
    cy.get('[data-testid="question-count"]').select('20')
    cy.get('[data-testid="time-select"]').first().select('30')
    cy.get('[data-testid="solo-start"]').should('not.be.disabled')
  })
})
