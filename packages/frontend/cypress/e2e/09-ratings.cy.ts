/// <reference types="cypress" />

describe('Ratings', () => {
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
      cy.visit('/ratings', {
        onBeforeLoad(win) {
          win.localStorage.setItem('accessToken', res.body.accessToken)
          win.localStorage.setItem('refreshToken', res.body.refreshToken)
          win.localStorage.setItem('user', JSON.stringify(res.body.user))
        },
      })
    })
  })

  it('shows the PvP ratings page', () => {
    cy.contains('h1', 'Рейтинг PvP').should('exist')
    cy.get('table').should('exist')
  })

  it('displays rating columns', () => {
    cy.contains('Игрок').should('exist')
    cy.contains('ELO').should('exist')
    cy.contains('Победы').should('exist')
    cy.contains('Пораж.').should('exist')
  })
})
