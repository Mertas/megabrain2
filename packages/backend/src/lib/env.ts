import crypto from 'node:crypto'
import dotenv from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env') })

function requireSecret(name: string, envKey: string): string {
  const value = process.env[envKey]
  if (value && value.length >= 32) return value
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`FATAL: ${envKey} must be set to a strong secret (≥32 chars) in production`)
  }
  const generated = crypto.randomBytes(32).toString('hex')
  console.warn(`[ENV] ${envKey} not set or too short — generated random secret for development`)
  return generated
}

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  JWT_ACCESS_SECRET: requireSecret('JWT_ACCESS_SECRET', 'JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requireSecret('JWT_REFRESH_SECRET', 'JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '30d',
  DB_PATH: process.env.DB_PATH || './data/megabrain.db',
}
