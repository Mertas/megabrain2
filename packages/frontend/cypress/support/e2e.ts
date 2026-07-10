/// <reference types="cypress" />

Cypress.Commands.add('selectTopicCategory', (index: number) => {
  cy.get('button').contains(/выбрать все/i).eq(index).click()
})
