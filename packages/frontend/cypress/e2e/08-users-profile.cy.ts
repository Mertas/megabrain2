/// <reference types="cypress" />

describe('Users & Profile', () => {
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
      cy.visit('/users', {
        onBeforeLoad(win) {
          win.localStorage.setItem('accessToken', res.body.accessToken)
          win.localStorage.setItem('refreshToken', res.body.refreshToken)
          win.localStorage.setItem('user', JSON.stringify(res.body.user))
        },
      })
    })
  })

  it('shows the users list', () => {
    cy.contains('h1', 'Люди').should('exist')
    cy.get('table').should('exist')
  })

  it('navigates to a user profile', () => {
    // Click on the first user login link in the table
    cy.get('table a').first().click()
    // Should land on profile page with Инфо tab visible
    cy.contains('button', 'Инфо').should('exist')
    cy.contains('button', 'Статистика').should('exist')
    cy.contains('button', 'Вопросы').should('exist')
  })

  it('shows stats on profile page', () => {
    cy.get('table a').first().click()
    cy.contains('button', 'Статистика').click()
    cy.contains('всего игр').should('exist')
  })
})
