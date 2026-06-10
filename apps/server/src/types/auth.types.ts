export interface RegisterInput {
  email: string
  password: string
  fullName: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface JwtPayload {
  userId: string
  role: string
}