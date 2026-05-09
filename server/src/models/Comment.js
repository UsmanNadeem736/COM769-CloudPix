import mongoose from 'mongoose'

const CommentSchema = new mongoose.Schema({
  photo:          { type: mongoose.Schema.Types.ObjectId, ref: 'Photo', required: true },
  author:         { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  text:           { type: String, required: true, trim: true, maxlength: 500 },
  sentimentScore: { type: Number, default: 0 },
  sentimentLabel: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
}, { timestamps: true })

CommentSchema.index({ photo: 1, createdAt: -1 })

export default mongoose.model('Comment', CommentSchema)
