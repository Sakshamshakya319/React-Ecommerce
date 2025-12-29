const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  // Firebase UID for authentication
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Custom customer ID for admin reference
  customerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic user information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // Password for email/password authentication (optional, used when not using Firebase)
  password: {
    type: String,
    select: false // Don't include in queries by default
  },
  
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  
  phoneNumber: {
    type: String,
    trim: true,
    default: ''
  },
  
  photoURL: {
    type: String,
    default: ''
  },
  
  // User role for authorization
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Profile information
  profile: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    bio: String
  },
  
  // Address information
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  
  // Preferences
  preferences: {
    newsletter: {
      type: Boolean,
      default: true
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    currency: {
      type: String,
      default: 'USD'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // Shopping behavior
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Refresh token for JWT
  refreshToken: {
    type: String,
    default: null
  },
  
  // Account metadata
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better performance
userSchema.index({ email: 1, firebaseUid: 1 })
userSchema.index({ customerId: 1 })
userSchema.index({ role: 1 })
userSchema.index({ createdAt: -1 })

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile?.firstName && this.profile?.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`
  }
  return this.displayName
})

// Virtual for order count
userSchema.virtual('orderCount', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'user',
  count: true
})

// Pre-save middleware to hash password and update timestamps
userSchema.pre('save', async function(next) {
  this.updatedAt = new Date()
  
  // Hash password if it's modified and exists
  if (this.isModified('password') && this.password) {
    try {
      const salt = await bcrypt.genSalt(10)
      this.password = await bcrypt.hash(this.password, salt)
    } catch (error) {
      return next(error)
    }
  }
  
  next()
})

// Method to generate customer ID
userSchema.statics.generateCustomerId = function() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9).toUpperCase()
  return `CUST_${timestamp}_${random}`
}

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false
  }
  return bcrypt.compare(candidatePassword, this.password)
}

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date()
  this.loginCount += 1
  return this.save()
}

// Method to add address
userSchema.methods.addAddress = function(addressData) {
  // If this is the first address or marked as default, make it default
  if (this.addresses.length === 0 || addressData.isDefault) {
    this.addresses.forEach(addr => addr.isDefault = false)
    addressData.isDefault = true
  }
  
  this.addresses.push(addressData)
  return this.save()
}

// Method to update address
userSchema.methods.updateAddress = function(addressId, updateData) {
  const address = this.addresses.id(addressId)
  if (!address) {
    throw new Error('Address not found')
  }
  
  // If setting as default, unset other defaults
  if (updateData.isDefault) {
    this.addresses.forEach(addr => addr.isDefault = false)
  }
  
  Object.assign(address, updateData)
  return this.save()
}

// Method to remove address
userSchema.methods.removeAddress = function(addressId) {
  const address = this.addresses.id(addressId)
  if (!address) {
    throw new Error('Address not found')
  }
  
  const wasDefault = address.isDefault
  address.remove()
  
  // If removed address was default, make first remaining address default
  if (wasDefault && this.addresses.length > 0) {
    this.addresses[0].isDefault = true
  }
  
  return this.save()
}

// Method to add to wishlist
userSchema.methods.addToWishlist = function(productId) {
  if (!this.wishlist.includes(productId)) {
    this.wishlist.push(productId)
    return this.save()
  }
  return Promise.resolve(this)
}

// Method to remove from wishlist
userSchema.methods.removeFromWishlist = function(productId) {
  this.wishlist = this.wishlist.filter(id => !id.equals(productId))
  return this.save()
}

// Method to get safe user data (excluding sensitive information)
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject()
  delete userObject.refreshToken
  delete userObject.__v
  return userObject
}

// Static method to find by Firebase UID
userSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.findOne({ firebaseUid })
}

// Static method to find by customer ID
userSchema.statics.findByCustomerId = function(customerId) {
  return this.findOne({ customerId })
}

module.exports = mongoose.model('User', userSchema)