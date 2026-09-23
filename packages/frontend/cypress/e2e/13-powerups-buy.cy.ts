/// <reference types="cypress" />

describe('Power-up Buying', () => {
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

  it('renders the powerups shop', () => {
    cy.contains('h1', 'Power-ups').should('exist')
    cy.contains('Доступно очков:').should('exist')
    cy.contains('Ваш инвентарь').should('exist')
  })

  it('shows powerup categories', () => {
    cy.contains('Универсальные').should('exist')
    cy.contains('Защитные').should('exist')
    cy.contains('Атакующие').should('exist')
    cy.contains('Глобальные').should('exist')
  })

  it('shows buy buttons on powerup cards', () => {
    cy.contains('button', 'Купить').should('exist')
  })
})
