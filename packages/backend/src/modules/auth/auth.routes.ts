import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, refresh, getMe, forgotPassword, verifyResetToken, resetPassword, AuthError } from './auth.service.js'
import { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, verifyResetTokenSchema, resetPasswordSchema } from './auth.schema.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { hashPassword, comparePassword } from '../../lib/password.js'
import { db } from '../../db/connection.js'
import { z } from 'zod'

export const authRouter = Router()

const isDev = process.env.NODE_ENV !== 'production'

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMIT', message: 'Слишком много попыток. Попробуйте позже.' },
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMIT', message: 'Слишком много попыток входа. Попробуйте позже.' },
})

authRouter.post('/register', strictLimiter, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body)
    const user = await register(input)
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
})

authRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body)
    const result = await login(input)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

authRouter.post('/refresh', (req, res, next) => {
  try {
    const input = refreshSchema.parse(req.body)
    const result = refresh(input)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

authRouter.get('/me', authenticate, (req, res, next) => {
  try {
    const user = getMe(req.userId!)
    res.json(user)
  } catch (err) {
    next(err)
  }
})

authRouter.post('/forgot-password', strictLimiter, (req, res, next) => {
  try {
    const input = forgotPasswordSchema.parse(req.body)
    forgotPassword(input)
    res.json({ message: 'Если пользователь существует, ссылка для сброса отправлена.' })
  } catch (err) {
    next(err)
  }
})

authRouter.get('/verify-reset-token', (req, res, next) => {
  try {
    const input = verifyResetTokenSchema.parse(req.query)
    const result = verifyResetToken(input.token)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const input = resetPasswordSchema.parse(req.body)
    const result = await resetPassword(input)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Пароль должен быть не менее 8 символов')
    .max(100)
    .regex(/[A-ZА-Я]/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/[a-zа-я]/, 'Пароль должен содержать хотя бы одну строчную букву')
    .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру'),
})

authRouter.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body)
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.userId) as { password: string } | undefined
    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Пользователь не найден' })
      return
    }
    const valid = await comparePassword(oldPassword, user.password)
    if (!valid) {
      res.status(400).json({ error: 'WRONG_PASSWORD', message: 'Неверный текущий пароль' })
      return
    }
    const hash = await hashPassword(newPassword)
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.userId)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})
