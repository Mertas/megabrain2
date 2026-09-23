/// <reference types="cypress" />

describe('Power-ups', () => {
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
      cy.visit('/powerups', {
        onBeforeLoad(win) {
          win.localStorage.setItem('accessToken', res.body.accessToken)
          win.localStorage.setItem('refreshToken', res.body.refreshToken)
          win.localStorage.setItem('user', JSON.stringify(res.body.user))
        },
      })
    })
  })

  it('renders the powerups page', () => {
    cy.contains('h1', 'Power-ups').should('exist')
    cy.contains('Доступно очков:').should('exist')
  })

  it('shows at least one power-up category', () => {
    cy.contains('Универсальные').should('exist')
  })

  it('shows the inventory section', () => {
    cy.contains('Ваш инвентарь').should('exist')
  })
})
