import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env'
import { notFound } from './middleware/notFound'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth.routes'   // ← move here
import { authenticate } from './middleware/authenticate'
import documentRoutes from './routes/document.routes'


const app = express()

app.use(helmet())
app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/api/documents', documentRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'DocuTrace API', timestamp: new Date().toISOString() })
})
// Protected test route
app.get('/api/me', authenticate, (req, res) => {
  res.json({ status: 'success', data: req.user })
})

app.use('/api/auth', authRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`✅ DocuTrace API running on http://localhost:${env.PORT}`)
})

export default app