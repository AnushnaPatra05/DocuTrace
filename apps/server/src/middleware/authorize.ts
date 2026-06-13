import { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'
import { UserRole } from '../generated/prisma'

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated')
    }
    if (!roles.includes(req.user.role as UserRole)) {
      throw new AppError(403, 'Insufficient permissions')
    }
    next()
  }
}