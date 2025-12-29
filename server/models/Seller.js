const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const sellerSchema = new mongoose.Schema({
  // Business Information
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['individual', 'partnership', 'company', 'llp'],
    required: true
  },
  gstNumber: {
    type: String,
    sparse: true, // Allow null values but ensure uniqueness when present
    uppercase: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number']
  },
  panNumber: {
    type: String,
    sparse: true, // Allow null values but ensure uniqueness when present
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
  },
  
  // Contact Information
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    type: String,
    required: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number starting with 6-9']
  },
  alternatePhone: {
    type: String,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number starting with 6-9']
  },
  
  // Password (for login)
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't include in queries by default
  },
  
  // Firebase Authentication
  firebaseUid: {
    type: String,
    sparse: true, // Allow null values but ensure uniqueness when present
    index: true
  },
  displayName: String,
  photoURL: String,
  authProvider: {
    type: String,
    enum: ['email', 'google', 'facebook'],
    default: 'email'
  },
  
  // Address Information
  businessAddress: {
    street: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true,
      match: [/^[1-9][0-9]{5}$/, 'Please enter a valid pincode']
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  
  // Bank Details
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: {
      type: String,
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code']
    },
    bankName: String,
    branch: String
  },
  
  // Business Details
  businessDescription: {
    type: String,
    required: true
  },
  website: String,
  categories: [{
    type: String,
    enum: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Toys', 'Beauty', 'Automotive', 'Health', 'Jewelry']
  }],
  expectedMonthlyVolume: String,
  
  // Documents
  documents: {
    gstCertificate: String,
    panCard: String,
    bankStatement: String,
    businessProof: String
  },
  
  // Status and Approval
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  approvalDate: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  
  // Seller Performance
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Deletion tracking
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: String,
  deletionReason: String,
  
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
  timestamps: true
})

// Indexes
sellerSchema.index({ email: 1 })
sellerSchema.index({ gstNumber: 1 }, { sparse: true })
sellerSchema.index({ panNumber: 1 }, { sparse: true })
sellerSchema.index({ status: 1 })
sellerSchema.index({ businessName: 'text', ownerName: 'text' })

// Pre-save middleware to hash password
sellerSchema.pre('save', async function(next) {
  // Only hash password if it's modified or new
  if (!this.isModified('password')) return next()
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare password
sellerSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Method to approve seller
sellerSchema.methods.approve = async function(approvedBy = null) {
  this.status = 'approved'
  this.approvalDate = new Date()
  // Don't set approvedBy to avoid ObjectId issues for now
  
  // Generate default password (seller can change later)
  const defaultPassword = Math.random().toString(36).slice(-8)
  this.password = defaultPassword
  
  await this.save()
  
  return defaultPassword // Return to send via email
}

// Method to reject seller
sellerSchema.methods.reject = async function(reason, rejectedBy = null) {
  this.status = 'rejected'
  this.rejectionReason = reason
  // Don't set approvedBy to avoid ObjectId issues for now
  await this.save()
}

// Method to suspend seller
sellerSchema.methods.suspend = async function(reason) {
  this.status = 'suspended'
  this.rejectionReason = reason
  await this.save()
}

// Method to update rating
sellerSchema.methods.updateRating = async function(newRating) {
  this.totalRatings += 1
  this.rating = ((this.rating * (this.totalRatings - 1)) + newRating) / this.totalRatings
  await this.save()
}

// Static method to get seller statistics
sellerSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ])
  
  const totalSellers = await this.countDocuments()
  const activeSellers = await this.countDocuments({ status: 'approved', isActive: true })
  
  return {
    total: totalSellers,
    active: activeSellers,
    byStatus: stats
  }
}

// Virtual for full name
sellerSchema.virtual('fullName').get(function() {
  return this.ownerName
})

// Transform output
sellerSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password
    delete ret.__v
    return ret
  }
})

module.exports = mongoose.model('Seller', sellerSchema)