const mongoose = require('mongoose')

const emailLogSchema = new mongoose.Schema({
  // Email details
  to: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
  from: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
  subject: {
    type: String,
    required: true,
    trim: true
  },
  
  body: {
    type: String,
    required: true
  },
  
  // Email type for categorization
  emailType: {
    type: String,
    required: true,
    enum: [
      'seller_approval',
      'seller_rejection', 
      'seller_password_reset',
      'order_confirmation',
      'order_status_update',
      'welcome_email',
      'password_reset',
      'account_verification'
    ]
  },
  
  // Status tracking
  status: {
    type: String,
    required: true,
    enum: ['pending', 'sent', 'failed', 'bounced'],
    default: 'pending'
  },
  
  // Delivery tracking
  sentAt: {
    type: Date
  },
  
  deliveredAt: {
    type: Date
  },
  
  failedAt: {
    type: Date
  },
  
  // Error details if failed
  errorMessage: {
    type: String
  },
  
  errorCode: {
    type: String
  },
  
  // Retry tracking
  retryCount: {
    type: Number,
    default: 0
  },
  
  maxRetries: {
    type: Number,
    default: 3
  },
  
  // Related entities
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['seller', 'user', 'order', 'admin']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntity.entityType'
    }
  },
  
  // Email provider details
  provider: {
    type: String,
    enum: ['gmail', 'sendgrid', 'mailgun', 'ses', 'nodemailer'],
    default: 'nodemailer'
  },
  
  messageId: {
    type: String // Provider's message ID
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
})

// Indexes for better performance
emailLogSchema.index({ to: 1, emailType: 1 })
emailLogSchema.index({ status: 1, createdAt: -1 })
emailLogSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 })
emailLogSchema.index({ createdAt: -1 })

// Method to mark email as sent
emailLogSchema.methods.markAsSent = function(messageId = null) {
  this.status = 'sent'
  this.sentAt = new Date()
  if (messageId) this.messageId = messageId
  return this.save()
}

// Method to mark email as failed
emailLogSchema.methods.markAsFailed = function(errorMessage, errorCode = null) {
  this.status = 'failed'
  this.failedAt = new Date()
  this.errorMessage = errorMessage
  if (errorCode) this.errorCode = errorCode
  return this.save()
}

// Method to mark email as delivered
emailLogSchema.methods.markAsDelivered = function() {
  this.status = 'sent' // Update to delivered if you have webhook support
  this.deliveredAt = new Date()
  return this.save()
}

// Method to retry sending
emailLogSchema.methods.canRetry = function() {
  return this.retryCount < this.maxRetries && this.status === 'failed'
}

emailLogSchema.methods.incrementRetry = function() {
  this.retryCount += 1
  this.status = 'pending'
  return this.save()
}

// Static method to get email statistics
emailLogSchema.statics.getEmailStats = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]
  
  const stats = await this.aggregate(pipeline)
  
  return {
    total: stats.reduce((sum, stat) => sum + stat.count, 0),
    sent: stats.find(s => s._id === 'sent')?.count || 0,
    failed: stats.find(s => s._id === 'failed')?.count || 0,
    pending: stats.find(s => s._id === 'pending')?.count || 0
  }
}

// Static method to get recent emails
emailLogSchema.statics.getRecentEmails = function(limit = 10, filters = {}) {
  return this.find(filters)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('relatedEntity.entityId')
}

module.exports = mongoose.model('EmailLog', emailLogSchema)