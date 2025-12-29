const mongoose = require('mongoose')

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  material: {
    type: String,
    enum: ['standard', 'metallic', 'glass', 'matte'],
    default: 'standard'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sku: {
    type: String,
    required: true
    // Removed unique constraint since we're not using variants
  },
  images: [String],
  isActive: {
    type: Boolean,
    default: true
  }
})

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  verified: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0
  },
  sellerReply: {
    message: {
      type: String,
      maxlength: 500
    },
    repliedAt: {
      type: Date
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  shortDescription: {
    type: String,
    maxlength: 500
  },
  
  category: {
    type: String,
    required: true,
    index: true
  },
  
  subcategory: {
    type: String,
    index: true
  },
  
  brand: {
    type: String,
    index: true
  },
  
  // Seller reference (for marketplace functionality)
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    index: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  originalPrice: {
    type: Number,
    min: 0
  },
  
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Inventory
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // 3D Model and Media (optional now)
  modelUrl: {
    type: String,
    required: false // Changed from required: true
  },
  
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  videos: [{
    url: String,
    title: String,
    thumbnail: String
  }],
  
  // Product variants (colors, materials, etc.)
  variants: [variantSchema],
  
  // Specifications
  specifications: {
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'in', 'm', 'ft'],
        default: 'cm'
      }
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['g', 'kg', 'lb', 'oz'],
        default: 'kg'
      }
    },
    material: String,
    color: String,
    features: [String],
    compatibility: [String]
  },
  
  // SEO and Marketing
  tags: [String],
  
  metaTitle: String,
  
  metaDescription: String,
  
  // Status and Visibility
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'discontinued'],
    default: 'draft'
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  isDigital: {
    type: Boolean,
    default: false
  },
  
  // Reviews and Ratings
  reviews: [reviewSchema],
  
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // Sales Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  
  salesCount: {
    type: Number,
    default: 0
  },
  
  // Shipping
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingClass: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  publishedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' })
productSchema.index({ category: 1, subcategory: 1 })
productSchema.index({ price: 1 })
productSchema.index({ 'rating.average': -1 })
productSchema.index({ featured: 1, status: 1 })
productSchema.index({ createdAt: -1 })
productSchema.index({ salesCount: -1 })
productSchema.index({ viewCount: -1 })

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100)
  }
  return this.price
})

// Virtual for availability status
productSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && this.stock > 0
})

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary)
  return primary ? primary.url : (this.images[0] ? this.images[0].url : null)
})

// Pre-save middleware
productSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  
  // Generate slug from name if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
  
  // Calculate discounted price
  if (this.originalPrice && this.discount > 0) {
    this.price = this.originalPrice * (1 - this.discount / 100)
  }
  
  // Update published date when status changes to active
  if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date()
  }
  
  next()
})

// Method to add review
productSchema.methods.addReview = function(reviewData) {
  this.reviews.push(reviewData)
  this.calculateRating()
  return this.save()
}

// Method to calculate average rating
productSchema.methods.calculateRating = function() {
  if (this.reviews.length === 0) {
    this.rating.average = 0
    this.rating.count = 0
    return
  }
  
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0)
  this.rating.average = Math.round((totalRating / this.reviews.length) * 10) / 10
  this.rating.count = this.reviews.length
}

// Method to increment view count
productSchema.methods.incrementViewCount = function() {
  this.viewCount += 1
  return this.save()
}

// Method to increment sales count
productSchema.methods.incrementSalesCount = function(quantity = 1) {
  this.salesCount += quantity
  return this.save()
}

// Method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    this.stock = Math.max(0, this.stock - quantity)
  } else if (operation === 'add') {
    this.stock += quantity
  }
  return this.save()
}

// Method to check if product is in stock
productSchema.methods.isInStock = function(quantity = 1) {
  return this.stock >= quantity && this.status === 'active'
}

// Static method to find by category
productSchema.statics.findByCategory = function(category, options = {}) {
  const query = { category, status: 'active' }
  return this.find(query, null, options)
}

// Static method to search products
productSchema.statics.searchProducts = function(searchTerm, options = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'active'
  }
  return this.find(query, { score: { $meta: 'textScore' } }, options)
    .sort({ score: { $meta: 'textScore' } })
}

// Static method to get featured products
productSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ featured: true, status: 'active' })
    .sort({ 'rating.average': -1, salesCount: -1 })
    .limit(limit)
}

// Static method to get products by price range
productSchema.statics.findByPriceRange = function(minPrice, maxPrice, options = {}) {
  const query = {
    price: { $gte: minPrice, $lte: maxPrice },
    status: 'active'
  }
  return this.find(query, null, options)
}

module.exports = mongoose.model('Product', productSchema)