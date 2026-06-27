import jwt from 'jsonwebtoken'
import { env } from './env.js'

export interface TokenPayload {
  userId: number
  type: 'access' | 'refresh'
}

export function signAccessToken(userId: number): string {
  return jwt.sign(
    { userId, type: 'access' } satisfies TokenPayload,
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES } as jwt.SignOptions,
  )
}

export function signRefreshToken(userId: number): string {
  return jwt.sign(
    { userId, type: 'refresh' } satisfies TokenPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES } as jwt.SignOptions,
  )
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload
}
