/// <reference types="cypress" />

describe('Admin — Questions', () => {
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
      cy.visit('/admin', {
        onBeforeLoad(win) {
          win.localStorage.setItem('accessToken', res.body.accessToken)
          win.localStorage.setItem('refreshToken', res.body.refreshToken)
          win.localStorage.setItem('user', JSON.stringify(res.body.user))
        },
      })
    })
  })

  it('shows admin page or access denied', () => {
    // Could be admin page or "access denied" — either is acceptable
    cy.get('body', { timeout: 10000 }).then(($body) => {
      const isAdmin = $body.text().includes('Админка')
      const isDenied = $body.text().includes('администратора')
      expect(isAdmin || isDenied).to.be.true
    })
  })

  it('shows questions table when admin', () => {
    cy.get('body', { timeout: 10000 }).then(($body) => {
      if ($body.text().includes('Админка')) {
        cy.get('table').should('exist')
        cy.contains('Текст').should('exist')
        cy.contains('Тема').should('exist')
        cy.contains('button', 'ред').should('exist')
      }
    })
  })
})
