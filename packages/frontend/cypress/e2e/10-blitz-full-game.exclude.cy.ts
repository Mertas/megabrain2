/// <reference types="cypress" />

describe('Blitz — Full Game with Bot', () => {
  let users: Array<{ login: string; password: string }>

  before(() => {
    cy.fixture('test-users').then((data) => { users = data })
  })

  it('plays a complete Blitz game against a bot opponent', () => {
    // 1. Start the bot first
    cy.task('startBot', { mode: 'blitz', userIndex: 1 }).then((result: any) => {
      // eslint-disable-next-line no-unused-expressions
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
      cy.visit('/blitz', {
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

    // 4. Wait for match — longer timeout
    cy.contains('Соперник найден!', { timeout: 40000 }).should('exist')

    // 5. Play through up to 5 rounds
    for (let round = 0; round < 5; round++) {
      cy.get('[data-testid="answer-option"]', { timeout: 30000 }).should('have.length', 4)
      cy.get('[data-testid="answer-option"]').first().click()
      cy.wait(3000)
    }

    // 6. Verify game results
    cy.get('h2', { timeout: 20000 }).then(($h2) => {
      const text = $h2.text()
      expect(text).to.satisfy((t: string) => {
        return t.includes('победили') || t.includes('проиграли') || t.includes('Ничья')
      })
    })
    cy.contains('Рейтинг:').should('exist')
    cy.contains('Раунды').should('exist')
    cy.contains('button', 'Играть снова').should('exist')

    // 7. Cleanup
    cy.task('stopBot', { mode: 'blitz' })
  })

  after(() => {
    cy.task('stopAllBots')
  })
})
