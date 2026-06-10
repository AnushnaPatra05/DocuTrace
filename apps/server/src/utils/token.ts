import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import { env } from '../config/env'

export const generateAccessToken = (
  userId: string,
  role: string
): string => {
  return jwt.sign(
    { userId, role },
    env.JWT_ACCESS_SECRET as Secret,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions['expiresIn'],
    }
  )
}

export const generateRefreshToken = (
  userId: string
): string => {
  return jwt.sign(
    { userId },
    env.JWT_REFRESH_SECRET as Secret,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES as SignOptions['expiresIn'],
    }
  )
}

export const verifyAccessToken = (token: string) => {
  return jwt.verify(
    token,
    env.JWT_ACCESS_SECRET as Secret
  ) as {
    userId: string
    role: string
  }
}

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(
    token,
    env.JWT_REFRESH_SECRET as Secret
  ) as {
    userId: string
  }
}