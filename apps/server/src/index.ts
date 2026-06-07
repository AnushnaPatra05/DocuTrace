import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env'
import { notFound } from './middleware/notFound'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// ── Core Middleware ──────────────────────────────────
app.use(helmet())
app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Health Check ─────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'DocuTrace API',
    timestamp: new Date().toISOString(),
  })
})

// ── 404 + Error Handlers ─────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start Server ─────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`✅ DocuTrace API running on http://localhost:${env.PORT}`)
})

export default app