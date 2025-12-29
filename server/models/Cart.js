const mongoose = require('mongoose')

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  variant: {
    color: String,
    material: String,
    size: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
})

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  items: [cartItemSchema],
  
  // Cart totals
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Applied coupons
  coupons: [{
    code: String,
    discount: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  }],
  
  // Cart status
  status: {
    type: String,
    enum: ['active', 'abandoned', 'converted'],
    default: 'active'
  },
  
  // Session tracking
  sessionId: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
cartSchema.index({ user: 1 })
cartSchema.index({ status: 1 })
cartSchema.index({ lastActivity: -1 })

// Virtual for item count
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0)
})

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  this.lastActivity = new Date()
  this.calculateTotals()
  next()
})

// Method to calculate cart totals
cartSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity)
  }, 0)
  
  // Calculate tax (example: 8.5%)
  this.tax = this.subtotal * 0.085
  
  // Calculate shipping (free shipping over $50)
  this.shipping = this.subtotal >= 50 ? 0 : 9.99
  
  // Apply coupon discounts
  this.discount = this.coupons.reduce((total, coupon) => {
    if (coupon.type === 'percentage') {
      return total + (this.subtotal * coupon.discount / 100)
    } else {
      return total + coupon.discount
    }
  }, 0)
  
  // Calculate final total
  this.total = Math.max(0, this.subtotal + this.tax + this.shipping - this.discount)
}

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity, variant, price) {
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId.toString() &&
    JSON.stringify(item.variant) === JSON.stringify(variant)
  )
  
  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += quantity
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      variant,
      price
    })
  }
  
  return this.save()
}

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.id(itemId)
  if (!item) {
    throw new Error('Item not found in cart')
  }
  
  if (quantity <= 0) {
    return this.removeItem(itemId)
  }
  
  item.quantity = quantity
  return this.save()
}

// Method to remove item from cart
cartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId.toString())
  return this.save()
}

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = []
  this.coupons = []
  return this.save()
}

// Method to apply coupon
cartSchema.methods.applyCoupon = function(couponCode, discount, type) {
  // Check if coupon already applied
  const existingCoupon = this.coupons.find(c => c.code === couponCode)
  if (existingCoupon) {
    throw new Error('Coupon already applied')
  }
  
  this.coupons.push({
    code: couponCode,
    discount,
    type
  })
  
  return this.save()
}

// Method to remove coupon
cartSchema.methods.removeCoupon = function(couponCode) {
  this.coupons = this.coupons.filter(c => c.code !== couponCode)
  return this.save()
}

// Static method to find or create cart for user
cartSchema.statics.findOrCreateForUser = async function(userId) {
  let cart = await this.findOne({ user: userId }).populate('items.product')
  
  if (!cart) {
    cart = new this({ user: userId })
    await cart.save()
  }
  
  return cart
}

// Static method to find abandoned carts
cartSchema.statics.findAbandoned = function(hoursAgo = 24) {
  const cutoffDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
  return this.find({
    status: 'active',
    lastActivity: { $lt: cutoffDate },
    'items.0': { $exists: true } // Has at least one item
  }).populate('user items.product')
}

module.exports = mongoose.model('Cart', cartSchema)