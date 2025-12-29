const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller'
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  variant: {
    color: String,
    material: String,
    size: String
  },
  sku: String,
  image: String
})

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // Customer information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  customerInfo: {
    email: String,
    phone: String,
    name: String
  },
  
  // Order items
  items: [orderItemSchema],
  
  // Pricing
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  
  shipping: {
    type: Number,
    required: true,
    min: 0
  },
  
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Shipping information
  shippingAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'US'
    }
  },
  
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Order status
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ],
    default: 'pending'
  },
  
  // Payment information
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'cash_on_delivery'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paymentIntentId: String,
    paidAt: Date
  },
  
  // Shipping information
  shippingInfo: {
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'pickup'],
      default: 'standard'
    },
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date
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
  
  // Order notes
  notes: {
    customer: String,
    admin: String,
    internal: String
  },
  
  // Status history
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
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
orderSchema.index({ user: 1 })
orderSchema.index({ orderNumber: 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index({ 'payment.status': 1 })

// Virtual for item count
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0)
})

// Virtual for formatted order number
orderSchema.virtual('formattedOrderNumber').get(function() {
  return `#${this.orderNumber}`
})

// Pre-save middleware
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  
  // Generate order number if not exists
  if (!this.orderNumber) {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    this.orderNumber = `ORD${timestamp.slice(-6)}${random}`
  }
  
  // Add status to history if status changed
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    })
  }
  
  next()
})

// Method to generate order number
orderSchema.methods.generateOrderNumber = function() {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD${timestamp.slice(-6)}${random}`
}

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
  this.status = newStatus
  
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy
  })
  
  // Update specific timestamps based on status
  switch (newStatus) {
    case 'shipped':
      this.shippingInfo.shippedAt = new Date()
      break
    case 'delivered':
      this.shippingInfo.deliveredAt = new Date()
      break
    case 'confirmed':
      if (this.payment.status === 'pending') {
        this.payment.status = 'completed'
        this.payment.paidAt = new Date()
      }
      break
  }
  
  return this.save()
}

// Method to add tracking information
orderSchema.methods.addTrackingInfo = function(carrier, trackingNumber, estimatedDelivery) {
  this.shippingInfo.carrier = carrier
  this.shippingInfo.trackingNumber = trackingNumber
  if (estimatedDelivery) {
    this.shippingInfo.estimatedDelivery = estimatedDelivery
  }
  
  return this.save()
}

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity)
  }, 0)
  
  // Apply coupon discounts
  this.discount = this.coupons.reduce((total, coupon) => {
    if (coupon.type === 'percentage') {
      return total + (this.subtotal * coupon.discount / 100)
    } else {
      return total + coupon.discount
    }
  }, 0)
  
  // Calculate final total
  this.total = this.subtotal + this.tax + this.shipping - this.discount
}

// Static method to generate order number
orderSchema.statics.generateOrderNumber = function() {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD${timestamp.slice(-6)}${random}`
}

// Static method to find orders by user
orderSchema.statics.findByUser = function(userId, options = {}) {
  return this.find({ user: userId }, null, options)
    .populate('items.product')
    .sort({ createdAt: -1 })
}

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status, options = {}) {
  return this.find({ status }, null, options)
    .populate('user items.product')
    .sort({ createdAt: -1 })
}

// Static method to get order statistics
orderSchema.statics.getStatistics = async function(startDate, endDate) {
  const matchStage = {}
  
  if (startDate || endDate) {
    matchStage.createdAt = {}
    if (startDate) matchStage.createdAt.$gte = new Date(startDate)
    if (endDate) matchStage.createdAt.$lte = new Date(endDate)
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        totalItems: { $sum: { $sum: '$items.quantity' } }
      }
    }
  ])
  
  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalItems: 0
  }
}

module.exports = mongoose.model('Order', orderSchema)