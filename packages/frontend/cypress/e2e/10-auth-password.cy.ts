/// <reference types="cypress" />

describe('Password Reset Flow', () => {
  it('shows the forgot password form', () => {
    cy.visit('/forgot-password')
    // Just verify the page loads without error
    cy.contains('Восстановление пароля', { timeout: 10000 }).should('exist')
  })

  it('shows the reset password page', () => {
    cy.visit('/reset-password?token=test-token')
    cy.contains('Новый пароль', { timeout: 10000 }).should('exist')
  })
})
