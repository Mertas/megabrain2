import { z } from 'zod'

export const registerSchema = z.object({
  login: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6).max(100),
})

export const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  login: z.string().min(1),
  email: z.string().email(),
})

export const verifyResetTokenSchema = z.object({
  token: z.string().min(1),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6).max(100),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type VerifyResetTokenInput = z.infer<typeof verifyResetTokenSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
