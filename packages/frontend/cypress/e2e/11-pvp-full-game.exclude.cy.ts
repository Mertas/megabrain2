/// <reference types="cypress" />

describe('PvP — Full Game with Bot', () => {
  let users: Array<{ login: string; password: string }>

  before(() => {
    cy.fixture('test-users').then((data) => { users = data })
  })

  it('plays a complete PvP game against a bot opponent', () => {
    // 1. Start the bot first
    cy.task('startBot', { mode: 'pvp', userIndex: 1 }).then((result: any) => {
      expect(result.ok).to.be.true
    })
    cy.wait(5000)

    // 2. Login as the main user
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { login: users[0].login, password: users[0].password },
      failOnStatusCode: false,
    }).then((res) => {
      cy.visit('/pvp', {
        onBeforeLoad(win) {
          win.localStorage.setItem('accessToken', res.body.accessToken)
          win.localStorage.setItem('refreshToken', res.body.refreshToken)
          win.localStorage.setItem('user', JSON.stringify(res.body.user))
        },
      })
    })

    // 3. Select topics and join queue
    cy.get('[data-testid="select-all-topics"]').first().click()
    cy.contains('button', 'Искать соперника').click()

    // 4. Wait for match
    cy.contains('Соперник найден!', { timeout: 40000 }).should('exist')

    // 5. Play through all 10 questions
    for (let q = 0; q < 10; q++) {
      cy.get('[data-testid="answer-option"]', { timeout: 30000 }).should('have.length.at.least', 2)
      cy.get('[data-testid="answer-option"]').first().click()
      cy.wait(3500)
    }

    // 6. Verify results screen
    cy.contains('h1', 'Результаты', { timeout: 20000 }).should('exist')
    cy.contains('ELO').should('exist')
    cy.contains('По вопросам').should('exist')
    cy.contains('button', 'Играть снова').should('exist')

    // 7. Cleanup
    cy.task('stopBot', { mode: 'pvp' })
  })

  after(() => {
    cy.task('stopAllBots')
  })
})
