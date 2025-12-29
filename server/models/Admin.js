const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't include in queries by default
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    default: 'admin',
    enum: ['admin', 'super-admin']
  },
  permissions: [{
    type: String,
    enum: ['users', 'products', 'orders', 'sellers', 'analytics', 'all']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  refreshToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true
})

// Index for performance
adminSchema.index({ username: 1 })
adminSchema.index({ email: 1 })
adminSchema.index({ isActive: 1 })

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw error
  }
}

// Update last login
adminSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date()
  return this.save()
}

// Convert to safe object (without sensitive data)
adminSchema.methods.toSafeObject = function() {
  const adminObject = this.toObject()
  delete adminObject.password
  delete adminObject.refreshToken
  return adminObject
}

module.exports = mongoose.model('Admin', adminSchema)