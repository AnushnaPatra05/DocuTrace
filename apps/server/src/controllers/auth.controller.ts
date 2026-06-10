import { Request, Response, NextFunction } from 'express'
import * as AuthService from '../services/auth.service'
import { AppError } from '../middleware/errorHandler'

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName } = req.body
    if (!email || !password || !fullName) {
      throw new AppError(400, 'email, password and fullName are required')
    }
    if (password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters')
    }
    const tokens = await AuthService.registerUser({ email, password, fullName })
    res.status(201).json({ status: 'success', data: tokens })
  } catch (err) {
    next(err)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      throw new AppError(400, 'email and password are required')
    }
    const tokens = await AuthService.loginUser({ email, password })
    res.status(200).json({ status: 'success', data: tokens })
  } catch (err) {
    next(err)
  }
}

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw new AppError(400, 'refreshToken is required')
    const tokens = await AuthService.refreshTokens(refreshToken)
    res.status(200).json({ status: 'success', data: tokens })
  } catch (err) {
    next(err)
  }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw new AppError(400, 'refreshToken is required')
    await AuthService.logoutUser(refreshToken)
    res.status(200).json({ status: 'success', message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
}