import dotenv from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env') })

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '30d',
  DB_PATH: process.env.DB_PATH || './data/megabrain.db',
}
