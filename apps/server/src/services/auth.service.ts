import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { hashPassword, comparePassword, hashToken, generateSecureToken } from '../utils/hash'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token'
import { RegisterInput, LoginInput, AuthTokens } from '../types/auth.types'

export const registerUser = async (input: RegisterInput): Promise<AuthTokens> => {
  const { email, password, fullName } = input

  // Check existing user
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })
  if (existing) throw new AppError(409, 'Email already registered')

  // Hash password
  const passwordHash = await hashPassword(password)

  // Create user + analytics row atomically
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
      },
    })
    await tx.documentAnalytics.create({
      data: { ownerId: newUser.id },
    })
    return newUser
  })

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role)
  const rawRefreshToken = generateRefreshToken(user.id)

  // Store hashed refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return { accessToken, refreshToken: rawRefreshToken }
}

export const loginUser = async (input: LoginInput): Promise<AuthTokens> => {
  const { email, password } = input

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })
  if (!user) throw new AppError(401, 'Invalid email or password')
  if (!user.isActive) throw new AppError(403, 'Account is disabled')

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) throw new AppError(401, 'Invalid email or password')

  const accessToken = generateAccessToken(user.id, user.role)
  const rawRefreshToken = generateRefreshToken(user.id)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_LOGIN',
      actorEmail: user.email,
    },
  })

  return { accessToken, refreshToken: rawRefreshToken }
}

export const refreshTokens = async (rawToken: string): Promise<AuthTokens> => {
  // Verify JWT
  const payload = verifyRefreshToken(rawToken)

  // Check token exists and is not revoked
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  })
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Invalid or expired refresh token')
  }

  // Rotate — revoke old, issue new
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || !user.isActive) throw new AppError(401, 'User not found')

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  })

  const newAccessToken = generateAccessToken(user.id, user.role)
  const newRawRefresh = generateRefreshToken(user.id)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(newRawRefresh),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return { accessToken: newAccessToken, refreshToken: newRawRefresh }
}

export const logoutUser = async (rawToken: string): Promise<void> => {
  const tokenHash = hashToken(rawToken)
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } })
  if (!stored) return

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      userId: stored.userId,
      action: 'USER_LOGOUT',
      actorEmail: '',
    },
  })
}