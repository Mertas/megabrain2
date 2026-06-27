import { Router } from 'express'
import { register, login, refresh, getMe, forgotPassword, verifyResetToken, resetPassword, AuthError } from './auth.service.js'
import { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, verifyResetTokenSchema, resetPasswordSchema } from './auth.schema.js'
import { authenticate } from '../../middleware/auth.middleware.js'

export const authRouter = Router()

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body)
    const user = await register(input)
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
})

authRouter.post('/login', async (req, res, next) => {
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

authRouter.post('/forgot-password', (req, res, next) => {
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
