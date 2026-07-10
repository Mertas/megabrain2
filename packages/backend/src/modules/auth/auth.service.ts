import { db } from '../../db/connection.js'
import { hashPassword, comparePassword } from '../../lib/password.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js'
import { toPublic, type User, type UserPublic } from './auth.types.js'
import type { RegisterInput, LoginInput, RefreshInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema.js'
import crypto from 'node:crypto'

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

function findUserByLogin(login: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE login = ?').get(login) as User | undefined
}

function findUserByEmail(email: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined
}

function findUserById(id: number): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined
}

function createUser(input: RegisterInput & { passwordHash: string; nickname: string }): User {
  const stmt = db.prepare(
    'INSERT INTO users (login, email, password, nickname) VALUES (?, ?, ?, ?)',
  )
  const result = stmt.run(input.login, input.email, input.passwordHash, input.nickname)
  return findUserById(Number(result.lastInsertRowid))!
}

function saveRefreshToken(userId: number, token: string, expiresAt: string): void {
  db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(
    userId,
    token,
    expiresAt,
  )
}

function deleteRefreshToken(token: string): void {
  db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token)
}

function findRefreshToken(token: string) {
  return db
    .prepare('SELECT * FROM refresh_tokens WHERE token = ?')
    .get(token) as { id: number; user_id: number; token: string; expires_at: string } | undefined
}

export async function register(input: RegisterInput): Promise<UserPublic> {
  const existingLogin = findUserByLogin(input.login)
  if (existingLogin) {
    throw new AuthError('LOGIN_EXISTS', 'Пользователь с таким логином уже существует', 409)
  }

  const existingEmail = findUserByEmail(input.email)
  if (existingEmail) {
    throw new AuthError('EMAIL_EXISTS', 'Пользователь с таким email уже существует', 409)
  }

  const passwordHash = await hashPassword(input.password)
  const user = createUser({ ...input, passwordHash, nickname: input.login })

  return toPublic(user)
}

export async function login(
  input: LoginInput,
): Promise<{ accessToken: string; refreshToken: string; user: UserPublic }> {
  const user = findUserByLogin(input.login)
  if (!user) {
    throw new AuthError('INVALID_CREDENTIALS', 'Неверный логин или пароль', 401)
  }

  const valid = await comparePassword(input.password, user.password)
  if (!valid) {
    throw new AuthError('INVALID_CREDENTIALS', 'Неверный логин или пароль', 401)
  }

  const accessToken = signAccessToken(user.id)
  const refreshToken = signRefreshToken(user.id)

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  saveRefreshToken(user.id, refreshToken, expiresAt)

  return { accessToken, refreshToken, user: toPublic(user) }
}

export function refresh(input: RefreshInput): { accessToken: string; refreshToken: string } {
  let payload
  try {
    payload = verifyRefreshToken(input.refreshToken)
  } catch {
    throw new AuthError('INVALID_TOKEN', 'Невалидный refresh-токен', 401)
  }

  if (payload.type !== 'refresh') {
    throw new AuthError('INVALID_TOKEN', 'Не refresh-токен', 401)
  }

  const stored = findRefreshToken(input.refreshToken)
  if (!stored) {
    throw new AuthError('INVALID_TOKEN', 'Токен не найден в БД', 401)
  }

  if (new Date(stored.expires_at) < new Date()) {
    deleteRefreshToken(input.refreshToken)
    throw new AuthError('TOKEN_EXPIRED', 'Refresh-токен истёк', 401)
  }

  deleteRefreshToken(input.refreshToken)

  const newAccessToken = signAccessToken(payload.userId)
  const newRefreshToken = signRefreshToken(payload.userId)

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  saveRefreshToken(payload.userId, newRefreshToken, expiresAt)

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

export function getMe(userId: number): UserPublic {
  const user = findUserById(userId)
  if (!user) {
    throw new AuthError('USER_NOT_FOUND', 'Пользователь не найден', 404)
  }
  return toPublic(user)
}

export function forgotPassword(input: ForgotPasswordInput): void {
  const user = findUserByLogin(input.login)
  if (!user || user.email !== input.email) return // не раскрываем существование пользователя

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // +1 час

  db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)').run(
    user.id,
    token,
    expiresAt,
  )

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[RESET] Link generated for ${user.login}`)
  }
}

export function verifyResetToken(token: string): { valid: boolean; login: string } {
  const row = db
    .prepare(`
      SELECT pr.*, u.login FROM password_resets pr
      JOIN users u ON u.id = pr.user_id
      WHERE pr.token = ? AND pr.used = 0
    `)
    .get(token) as { expires_at: string; login: string } | undefined

  if (!row) {
    throw new AuthError('INVALID_TOKEN', 'Токен не найден или уже использован', 400)
  }

  if (new Date(row.expires_at) < new Date()) {
    throw new AuthError('TOKEN_EXPIRED', 'Токен истёк', 410)
  }

  return { valid: true, login: row.login }
}

export async function resetPassword(input: ResetPasswordInput): Promise<{ login: string; accessToken: string; refreshToken: string; user: UserPublic }> {
  const row = db
    .prepare(`
      SELECT pr.*, u.login, u.email, u.nickname, u.level, u.icon, u.is_admin, u.created_at FROM password_resets pr
      JOIN users u ON u.id = pr.user_id
      WHERE pr.token = ? AND pr.used = 0
    `)
    .get(input.token) as { id: number; user_id: number; expires_at: string; login: string; email: string; nickname: string; level: number; icon: string; is_admin: number; created_at: string } | undefined

  if (!row) {
    throw new AuthError('INVALID_TOKEN', 'Токен не найден или уже использован', 400)
  }

  if (new Date(row.expires_at) < new Date()) {
    throw new AuthError('TOKEN_EXPIRED', 'Токен истёк', 410)
  }

  const passwordHash = await hashPassword(input.password)

  db.prepare('UPDATE users SET password = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
    passwordHash,
    row.user_id,
  )

  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(row.id)

  const accessToken = signAccessToken(row.user_id)
  const refreshToken = signRefreshToken(row.user_id)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  saveRefreshToken(row.user_id, refreshToken, expiresAt)

  return {
    login: row.login,
    accessToken,
    refreshToken,
    user: toPublic(findUserById(row.user_id)!),
  }
}
