import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/token'
import { AppError } from './errorHandler'

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided')
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)
    req.user = { userId: payload.userId, role: payload.role as any }
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new AppError(401, 'Token expired'))
    } else if (err.name === 'JsonWebTokenError') {
      next(new AppError(401, 'Invalid token'))
    } else {
      next(err)
    }
  }
}