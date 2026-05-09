import mongoose from 'mongoose'

const RatingSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true, min: 1, max: 5 },
}, { _id: false })

const PhotoSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true, maxlength: 80 },
  caption:  { type: String, trim: true, maxlength: 500, default: '' },
  location: { type: String, trim: true, default: '' },
  people:   [{ type: String, trim: true }],
  tags:     [{ type: String, trim: true, lowercase: true }],
  imageUrl: { type: String, required: true },
  blobName: { type: String, default: '' },
  creator:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  ratings:  [RatingSchema],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

PhotoSchema.virtual('likesCount').get(function () {
  return this.likes.length
})

PhotoSchema.virtual('ratingAverage').get(function () {
  if (!this.ratings.length) return 0
  const sum = this.ratings.reduce((acc, r) => acc + r.value, 0)
  return Math.round((sum / this.ratings.length) * 10) / 10
})

PhotoSchema.virtual('ratingCount').get(function () {
  return this.ratings.length
})

PhotoSchema.index({ creator: 1 })
PhotoSchema.index({ tags: 1 })
PhotoSchema.index({ createdAt: -1 })
PhotoSchema.index({ title: 'text', caption: 'text', location: 'text' })

export default mongoose.model('Photo', PhotoSchema)
