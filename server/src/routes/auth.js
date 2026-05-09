import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function userPayload(user) {
  return {
    id:        user._id,
    name:      user.name,
    firstName: user.firstName,
    lastName:  user.lastName,
    email:     user.email,
    handle:    user.handle,
    role:      user.role,
    avatar:    user.avatar,
  }
}

// POST /api/auth/register
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['consumer', 'creator']).withMessage('Role must be consumer or creator'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  try {
    const { firstName, lastName, email, password, role } = req.body
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const base   = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
    const suffix = Math.floor(Math.random() * 9000) + 1000
    const handle = `@${base}${suffix}`

    const user  = await User.create({ firstName, lastName, email, password, handle, role })
    const token = signToken(user._id)

    res.status(201).json({ token, user: userPayload(user) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = signToken(user._id)
    res.json({ token, user: userPayload(user) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: userPayload(req.user) })
})

export default router
