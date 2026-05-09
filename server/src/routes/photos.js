import { Router } from 'express'
import { body, query, validationResult } from 'express-validator'
import Photo from '../models/Photo.js'
import Comment from '../models/Comment.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { multerMemory, uploadToAzure, deleteFromAzure } from '../middleware/upload.js'

const router = Router()

// GET /api/photos  — public browse with search + filter + pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('tag').optional().isString(),
  query('q').optional().isString(),
  query('sort').optional().isIn(['latest', 'popular', 'rated']),
  query('creator').optional().isString(),
], async (req, res) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page)  || 1)
    const limit   = Math.min(50, parseInt(req.query.limit) || 12)
    const skip    = (page - 1) * limit
    const { tag, q, sort = 'latest', creator } = req.query

    const filter = {}
    if (tag && tag !== 'All') filter.tags = tag
    if (creator) filter.creator = creator
    if (q) {
      filter.$or = [
        { title:    { $regex: q, $options: 'i' } },
        { caption:  { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { tags:     { $regex: q, $options: 'i' } },
      ]
    }

    const sortMap = {
      latest:  { createdAt: -1 },
      popular: { 'likes': -1 },
      rated:   { createdAt: -1 },
    }

    const [photos, total] = await Promise.all([
      Photo.find(filter)
        .populate('creator', 'firstName lastName handle avatar')
        .sort(sortMap[sort])
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      Photo.countDocuments(filter),
    ])

    res.set('Cache-Control', 'public, max-age=30')
    res.json({ photos, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/photos/my/stats  — aggregate analytics for authenticated creator
router.get('/my/stats', requireAuth, requireRole('creator'), async (req, res) => {
  try {
    const myPhotos = await Photo.find({ creator: req.user._id })
      .select('title likes ratings')
      .lean({ virtuals: true })

    const photoIds     = myPhotos.map(p => p._id)
    const totalLikes   = myPhotos.reduce((sum, p) => sum + p.likes.length, 0)
    const allRatings   = myPhotos.flatMap(p => p.ratings.map(r => r.value))
    const avgRating    = allRatings.length
      ? Math.round((allRatings.reduce((s, v) => s + v, 0) / allRatings.length) * 10) / 10
      : 0
    const totalComments = await Comment.countDocuments({ photo: { $in: photoIds } })
    const topPhotos = [...myPhotos]
      .sort((a, b) => b.likes.length - a.likes.length)
      .slice(0, 5)
      .map(p => ({ _id: p._id, title: p.title, likesCount: p.likes.length }))

    res.json({ totalPhotos: myPhotos.length, totalLikes, totalComments, avgRating, topPhotos })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/photos/my/activity  — recent comments on creator's photos
router.get('/my/activity', requireAuth, requireRole('creator'), async (req, res) => {
  try {
    const myPhotos = await Photo.find({ creator: req.user._id }).select('_id title').lean()
    const photoIds = myPhotos.map(p => p._id)
    const photoMap = Object.fromEntries(myPhotos.map(p => [p._id.toString(), p.title]))

    const recentComments = await Comment.find({ photo: { $in: photoIds } })
      .populate('author', 'firstName lastName handle')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    const activity = recentComments.map(c => ({
      type: 'comment',
      user: `${c.author.firstName} ${c.author.lastName}`,
      handle: c.author.handle,
      photoTitle: photoMap[c.photo.toString()] || 'a photo',
      text: c.text,
      createdAt: c.createdAt,
    }))

    res.json({ activity })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/photos/:id
router.get('/:id', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id)
      .populate('creator', 'firstName lastName handle avatar')
      .lean({ virtuals: true })
    if (!photo) return res.status(404).json({ error: 'Photo not found' })
    res.set('Cache-Control', 'public, max-age=30')
    res.json({ photo })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/photos  — creator only, multipart/form-data
router.post('/', requireAuth, requireRole('creator'), multerMemory.single('image'), [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 80 }),
  body('caption').optional().isLength({ max: 500 }),
  body('location').optional().isString(),
  body('tags').optional().isString(),
  body('people').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  try {
    let imageUrl = ''
    let blobName = ''

    if (req.file) {
      const result = await uploadToAzure(req.file)
      imageUrl = result.url
      blobName = result.blobName
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl
    } else {
      return res.status(400).json({ error: 'Image file or imageUrl is required' })
    }

    const tags   = req.body.tags   ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean)   : []
    const people = req.body.people ? req.body.people.split(',').map(p => p.trim()).filter(Boolean) : []

    const photo = await Photo.create({
      title:    req.body.title,
      caption:  req.body.caption  || '',
      location: req.body.location || '',
      people,
      tags,
      imageUrl,
      blobName,
      creator: req.user._id,
    })

    const populated = await Photo.findById(photo._id)
      .populate('creator', 'firstName lastName handle avatar')
      .lean({ virtuals: true })

    res.status(201).json({ photo: populated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/photos/:id  — creator (own photo)
router.put('/:id', requireAuth, requireRole('creator'), [
  body('title').optional().trim().isLength({ max: 80 }),
  body('caption').optional().isLength({ max: 500 }),
], async (req, res) => {
  try {
    const photo = await Photo.findOne({ _id: req.params.id, creator: req.user._id })
    if (!photo) return res.status(404).json({ error: 'Photo not found or not yours' })

    const { title, caption, location, tags, people } = req.body
    if (title)    photo.title    = title
    if (caption !== undefined) photo.caption = caption
    if (location !== undefined) photo.location = location
    if (tags)     photo.tags     = tags.split(',').map(t => t.trim()).filter(Boolean)
    if (people)   photo.people   = people.split(',').map(p => p.trim()).filter(Boolean)

    await photo.save()
    const updated = await Photo.findById(photo._id)
      .populate('creator', 'firstName lastName handle avatar')
      .lean({ virtuals: true })
    res.json({ photo: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/photos/:id  — creator (own photo)
router.delete('/:id', requireAuth, requireRole('creator'), async (req, res) => {
  try {
    const photo = await Photo.findOne({ _id: req.params.id, creator: req.user._id })
    if (!photo) return res.status(404).json({ error: 'Photo not found or not yours' })

    await deleteFromAzure(photo.blobName)
    await photo.deleteOne()
    res.json({ message: 'Photo deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/photos/:id/like  — toggle like (authenticated)
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const photo    = await Photo.findById(req.params.id)
    if (!photo) return res.status(404).json({ error: 'Photo not found' })

    const uid  = req.user._id.toString()
    const idx  = photo.likes.findIndex(l => l.toString() === uid)
    const liked = idx === -1

    if (liked) photo.likes.push(req.user._id)
    else        photo.likes.splice(idx, 1)

    await photo.save()
    res.json({ liked, likesCount: photo.likes.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/photos/:id/rate  — rate photo (consumer, once per photo)
router.post('/:id/rate', requireAuth, [
  body('value').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  try {
    const photo = await Photo.findById(req.params.id)
    if (!photo) return res.status(404).json({ error: 'Photo not found' })

    const uid  = req.user._id.toString()
    const existing = photo.ratings.find(r => r.user.toString() === uid)

    if (existing) existing.value = req.body.value
    else           photo.ratings.push({ user: req.user._id, value: req.body.value })

    await photo.save()
    const avg = photo.ratings.reduce((s, r) => s + r.value, 0) / photo.ratings.length
    res.json({ ratingAverage: Math.round(avg * 10) / 10, ratingCount: photo.ratings.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/photos/:id/my-rating  — get current user's rating
router.get('/:id/my-rating', requireAuth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id).select('ratings')
    if (!photo) return res.status(404).json({ error: 'Photo not found' })
    const uid = req.user._id.toString()
    const r   = photo.ratings.find(r => r.user.toString() === uid)
    res.json({ rating: r ? r.value : 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
