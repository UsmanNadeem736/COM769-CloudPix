import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, minlength: 6 },
  handle:    { type: String, required: true, unique: true, trim: true },
  role:      { type: String, enum: ['consumer', 'creator'], default: 'consumer' },
  avatar:    { type: String, default: '' },
}, { timestamps: true })

UserSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`
})

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}


export default mongoose.model('User', UserSchema)
