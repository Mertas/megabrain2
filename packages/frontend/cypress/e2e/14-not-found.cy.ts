/// <reference types="cypress" />

describe('404 Not Found', () => {
  it('shows 404 page for unknown routes', () => {
    cy.visit('/this-route-does-not-exist-12345', { failOnStatusCode: false })
    cy.contains('404', { timeout: 10000 }).should('exist')
  })
})
