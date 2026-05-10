import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import Comment from '../models/Comment.js'
import Photo   from '../models/Photo.js'
import { requireAuth } from '../middleware/auth.js'
import { analyzeSentiment } from '../services/sentiment.js'

const router = Router({ mergeParams: true })

// GET /api/photos/:photoId/comments
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find({ photo: req.params.photoId })
      .populate('author', 'firstName lastName handle avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    res.set('Cache-Control', 'public, max-age=10')
    res.json({ comments })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/photos/:photoId/comments
router.post('/', requireAuth, [
  body('text').trim().notEmpty().withMessage('Comment text is required')
    .isLength({ max: 500 }).withMessage('Comment too long'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  try {
    const photo = await Photo.findById(req.params.photoId)
    if (!photo) return res.status(404).json({ error: 'Photo not found' })

    const { score, label } = await analyzeSentiment(req.body.text)

    const comment = await Comment.create({
      photo:          photo._id,
      author:         req.user._id,
      text:           req.body.text,
      sentimentScore: score,
      sentimentLabel: label,
    })

    const populated = await Comment.findById(comment._id)
      .populate('author', 'firstName lastName handle avatar')
      .lean()

    res.status(201).json({ comment: populated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/photos/:photoId/comments/:commentId  — own comment only
router.delete('/:commentId', requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id:    req.params.commentId,
      author: req.user._id,
    })
    if (!comment) return res.status(404).json({ error: 'Comment not found or not yours' })
    await comment.deleteOne()
    res.json({ message: 'Comment deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
