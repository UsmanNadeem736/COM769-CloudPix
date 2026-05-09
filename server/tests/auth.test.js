import request from 'supertest'
import mongoose from 'mongoose'
import app from '../src/index.js'

const TEST_USER = {
  firstName: 'Test',
  lastName:  'User',
  email:     `test_${Date.now()}@lumora.dev`,
  password:  'testpass123',
  role:      'consumer',
}

let token

beforeAll(async () => {
  // Wait for DB connection used by the app
  await new Promise(resolve => setTimeout(resolve, 2000))
})

afterAll(async () => {
  await mongoose.connection.close()
})

describe('POST /api/auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.role).toBe('consumer')
    token = res.body.token
  })

  it('rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER)
    expect(res.status).toBe(409)
  })

  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email, password: TEST_USER.password,
    })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email, password: 'wrongpassword',
    })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns current user with valid token', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(TEST_USER.email)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
