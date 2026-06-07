import dotenv from 'dotenv'
dotenv.config()

const required = (key: string): string => {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const env = {
  NODE_ENV:            process.env.NODE_ENV || 'development',
  PORT:                parseInt(process.env.PORT || '5000'),
  CLIENT_URL:          process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL:        required('DATABASE_URL'),
  JWT_ACCESS_SECRET:   required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET:  required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES:  process.env.JWT_ACCESS_EXPIRES  || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
} as const