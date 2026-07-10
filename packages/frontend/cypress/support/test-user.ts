const firstNames = ['artem', 'maria', 'dmitry', 'anna', 'sergey', 'elena', 'alexey', 'olga', 'maxim', 'natalia']
const lastNames = ['smirnov', 'ivanova', 'kuznetsov', 'petrova', 'sokolov', 'mikhailova', 'fedorov', 'novikova', 'morozov', 'volkova']

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateTestUser() {
  const first = pick(firstNames)
  const last = pick(lastNames)
  const suffix = Date.now().toString(36)
  const login = `${first}_${last}_${suffix}`
  const nickname = `${first} ${last}`
  const email = `${login}@example.com`
  const password = 'TestPass1'
  return { login, nickname, email, password }
}

export const TEST_USER = generateTestUser()

export function registerTestUser() {
  cy.log(`Registering: ${TEST_USER.login} / ${TEST_USER.password}`)
  cy.request({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      login: TEST_USER.login,
      email: TEST_USER.email,
      password: TEST_USER.password,
    },
    failOnStatusCode: false,
  }).then((res) => {
    expect(res.status).to.be.oneOf([201, 409], `Register failed: ${JSON.stringify(res.body)}`)
    cy.log(`User ready: ${TEST_USER.login}`)
  })
}

export function cleanupTestUser() {
  cy.log(`Test user: ${TEST_USER.login}`)
}
