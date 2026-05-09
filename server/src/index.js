import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { connectDB } from './config/db.js'
import authRoutes    from './routes/auth.js'
import photoRoutes   from './routes/photos.js'
import commentRoutes from './routes/comments.js'

const app  = express()
const PORT = process.env.PORT || 5000

// ── Security & perf middleware ──────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(compression())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ── CORS ────────────────────────────────────────────────────
const allowed = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',').map(s => s.trim())

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin)) return cb(null, true)
    cb(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}))

// ── Body parsing ────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Rate limiting ───────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
}))

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',                  authRoutes)
app.use('/api/photos',                photoRoutes)
app.use('/api/photos/:photoId/comments', commentRoutes)

// ── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }))

// ── 404 ─────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }))

// ── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

// ── Start ────────────────────────────────────────────────────
connectDB()
  .then(() => app.listen(PORT, () => console.log(`Lumora API running on port ${PORT}`)))
  .catch(err => { console.error('DB connection failed:', err); process.exit(1) })

export default app
