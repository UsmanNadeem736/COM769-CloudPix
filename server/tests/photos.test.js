import request from 'supertest'
import mongoose from 'mongoose'
import app from '../src/index.js'

let creatorToken
let photoId

const CREATOR = {
  firstName: 'Photo',
  lastName:  'Creator',
  email:     `creator_${Date.now()}@lumora.dev`,
  password:  'testpass123',
  role:      'creator',
}

const CONSUMER = {
  firstName: 'Photo',
  lastName:  'Consumer',
  email:     `consumer_${Date.now()}@lumora.dev`,
  password:  'testpass123',
  role:      'consumer',
}

let consumerToken

beforeAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 2000))

  const r1 = await request(app).post('/api/auth/register').send(CREATOR)
  creatorToken = r1.body.token

  const r2 = await request(app).post('/api/auth/register').send(CONSUMER)
  consumerToken = r2.body.token
})

afterAll(async () => {
  await mongoose.connection.close()
})

describe('GET /api/photos', () => {
  it('returns photo list', async () => {
    const res = await request(app).get('/api/photos')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('photos')
    expect(Array.isArray(res.body.photos)).toBe(true)
  })

  it('supports search query', async () => {
    const res = await request(app).get('/api/photos?q=kyoto')
    expect(res.status).toBe(200)
  })
})

describe('POST /api/photos', () => {
  it('allows creator to create a photo with imageUrl', async () => {
    const res = await request(app)
      .post('/api/photos')
      .set('Authorization', `Bearer ${creatorToken}`)
      .field('title', 'Test Photo')
      .field('caption', 'A test caption')
      .field('location', 'Test City')
      .field('tags', 'test,sample')
      .field('imageUrl', 'https://picsum.photos/seed/test/600/400')

    expect(res.status).toBe(201)
    expect(res.body.photo.title).toBe('Test Photo')
    photoId = res.body.photo._id
  })

  it('blocks consumer from creating a photo', async () => {
    const res = await request(app)
      .post('/api/photos')
      .set('Authorization', `Bearer ${consumerToken}`)
      .field('title', 'Should Fail')
      .field('imageUrl', 'https://picsum.photos/600/400')
    expect(res.status).toBe(403)
  })

  it('requires auth', async () => {
    const res = await request(app).post('/api/photos')
      .field('title', 'No Auth')
      .field('imageUrl', 'https://picsum.photos/600/400')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/photos/:id/like', () => {
  it('allows authenticated user to like a photo', async () => {
    const res = await request(app)
      .post(`/api/photos/${photoId}/like`)
      .set('Authorization', `Bearer ${consumerToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('liked')
  })
})

describe('POST /api/photos/:id/rate', () => {
  it('allows authenticated user to rate a photo', async () => {
    const res = await request(app)
      .post(`/api/photos/${photoId}/rate`)
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({ value: 5 })
    expect(res.status).toBe(200)
    expect(res.body.ratingAverage).toBe(5)
  })

  it('rejects invalid rating', async () => {
    const res = await request(app)
      .post(`/api/photos/${photoId}/rate`)
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({ value: 10 })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/photos/:id/comments', () => {
  it('allows authenticated user to comment', async () => {
    const res = await request(app)
      .post(`/api/photos/${photoId}/comments`)
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({ text: 'Amazing shot!' })
    expect(res.status).toBe(201)
    expect(res.body.comment).toHaveProperty('sentimentLabel')
  })
})
