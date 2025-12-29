const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  // Review identification
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // Review content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Review images (optional)
  images: [{
    url: String,
    alt: String
  }],
  
  // Review status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  
  // Helpful votes
  helpfulVotes: {
    type: Number,
    default: 0
  },
  
  // Users who found this review helpful
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Verification
  verified: {
    type: Boolean,
    default: true // Since it's from a verified purchase
  },
  
  // Admin response (optional)
  adminResponse: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
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

// Indexes
reviewSchema.index({ product: 1, createdAt: -1 })
reviewSchema.index({ user: 1, createdAt: -1 })
reviewSchema.index({ order: 1 })
reviewSchema.index({ rating: 1 })
reviewSchema.index({ status: 1 })

// Compound index to ensure one review per user per product per order
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true })

// Virtual for formatted date
reviewSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Virtual for time ago
reviewSchema.virtual('timeAgo').get(function() {
  const now = new Date()
  const diff = now - this.createdAt
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
})

// Pre-save middleware
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Method to mark as helpful
reviewSchema.methods.markHelpful = function(userId) {
  if (!this.helpfulBy.includes(userId)) {
    this.helpfulBy.push(userId)
    this.helpfulVotes += 1
    return this.save()
  }
  return Promise.resolve(this)
}

// Method to unmark as helpful
reviewSchema.methods.unmarkHelpful = function(userId) {
  const index = this.helpfulBy.indexOf(userId)
  if (index > -1) {
    this.helpfulBy.splice(index, 1)
    this.helpfulVotes = Math.max(0, this.helpfulVotes - 1)
    return this.save()
  }
  return Promise.resolve(this)
}

// Method to add admin response
reviewSchema.methods.addAdminResponse = function(message, adminId) {
  this.adminResponse = {
    message,
    respondedBy: adminId,
    respondedAt: new Date()
  }
  return this.save()
}

// Static method to get product reviews
reviewSchema.statics.getProductReviews = function(productId, options = {}) {
  const { page = 1, limit = 10, sort = '-createdAt' } = options
  const skip = (page - 1) * limit
  
  return this.find({ product: productId, status: 'approved' })
    .populate('user', 'displayName avatar')
    .sort(sort)
    .skip(skip)
    .limit(limit)
}

// Static method to get user reviews
reviewSchema.statics.getUserReviews = function(userId, options = {}) {
  const { page = 1, limit = 10 } = options
  const skip = (page - 1) * limit
  
  return this.find({ user: userId })
    .populate('product', 'name images')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
}

// Static method to calculate product rating stats
reviewSchema.statics.getProductRatingStats = async function(productId) {
  const stats = await this.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ])
  
  if (stats.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
  }
  
  const result = stats[0]
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  
  result.ratingDistribution.forEach(rating => {
    distribution[rating] = (distribution[rating] || 0) + 1
  })
  
  return {
    totalReviews: result.totalReviews,
    averageRating: Math.round(result.averageRating * 10) / 10,
    ratingDistribution: distribution
  }
}

// Static method to check if user can review product
reviewSchema.statics.canUserReview = async function(userId, productId) {
  // Check if user has purchased this product
  const Order = mongoose.model('Order')
  const purchasedOrder = await Order.findOne({
    user: userId,
    'items.product': productId,
    status: { $in: ['delivered'] } // Only delivered orders can be reviewed
  })
  
  if (!purchasedOrder) {
    return { canReview: false, reason: 'Product not purchased or not delivered' }
  }
  
  // Check if user has already reviewed this product for this order
  const existingReview = await this.findOne({
    user: userId,
    product: productId,
    order: purchasedOrder._id
  })
  
  if (existingReview) {
    return { canReview: false, reason: 'Already reviewed this product' }
  }
  
  return { canReview: true, orderId: purchasedOrder._id }
}

module.exports = mongoose.model('Review', reviewSchema)