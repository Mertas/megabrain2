/// <reference types="cypress" />

describe('Profile Editing', () => {
  let users: Array<{ login: string; password: string }>

  before(() => {
    cy.fixture('test-users').then((data) => { users = data })
  })

  it('shows own profile page', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { login: users[0].login, password: users[0].password },
      failOnStatusCode: false,
    }).then((res) => {
      const login = res.body.user.login
      cy.visit(`/users/${login}`, {
        onBeforeLoad(win) {
          win.localStorage.setItem('accessToken', res.body.accessToken)
          win.localStorage.setItem('refreshToken', res.body.refreshToken)
          win.localStorage.setItem('user', JSON.stringify(res.body.user))
        },
      })
    })

    // Verify Инфо tab (profile page loaded)
    cy.contains('button', 'Инфо').should('exist')
    cy.contains('button', 'Статистика').should('exist')
    cy.contains('button', 'Вопросы').should('exist')
  })

  it('shows user details in info tab', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { login: users[0].login, password: users[0].password },
      failOnStatusCode: false,
    }).then((res) => {
      const login = res.body.user.login
      cy.visit(`/users/${login}`, {
        onBeforeLoad(win) {
          win.localStorage.setItem('accessToken', res.body.accessToken)
          win.localStorage.setItem('refreshToken', res.body.refreshToken)
          win.localStorage.setItem('user', JSON.stringify(res.body.user))
        },
      })
    })

    cy.contains('О себе').should('exist')
    cy.contains('Логин').should('exist')
    cy.contains('Уровень').should('exist')
    cy.contains('На сайте с').should('exist')
  })
})
