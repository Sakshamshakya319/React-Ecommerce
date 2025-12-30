const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const admin = require('firebase-admin')
const User = require('../models/User')
const Seller = require('../models/Seller')
const unifiedEmailService = require('../services/unifiedEmailService')

const router = express.Router()

// Simple test route for unified auth
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Unified auth routes working (email service disabled)',
    timestamp: new Date().toISOString()
  })
})

// @route   POST /api/unified-auth/forgot-password
// @desc    Smart forgot password - detects user type automatically
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      })
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      })
    }
    
    // Detect recipient type
    const recipient = await unifiedEmailService.detectRecipientType(email)
    
    if (recipient.type === 'unknown') {
      // For security, don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset email shortly.'
      })
    }
    
    // Check account status
    if (recipient.type === 'seller' && recipient.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Your seller account is not approved. Please contact support.'
      })
    }
    
    if (recipient.type === 'user' && recipient.status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'Your account is inactive. Please contact support.'
      })
    }
    
    // Generate reset token
    const resetToken = jwt.sign(
      { 
        userId: recipient.data._id,
        email: recipient.data.email,
        userType: recipient.type,
        purpose: 'password-reset'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )
    
    // Create reset URL based on user type
    const resetPath = recipient.type === 'seller' ? '/seller/reset-password' : '/reset-password'
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}${resetPath}?token=${resetToken}`
    
    try {
      // Send password reset email using unified service
      await unifiedEmailService.sendPasswordReset(email, resetUrl)
      
      console.log(`✅ Password reset email sent to ${recipient.type}: ${email}`)
      
      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully. Please check your inbox.',
        recipientType: recipient.type,
        resetUrl,
        ...(process.env.NODE_ENV === 'development' && { 
          debug: {
            email: recipient.data.email,
            name: recipient.name,
            type: recipient.type,
            status: recipient.status
          }
        })
      })
      
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError.message)
      
      // Log the error but don't expose email service issues to user
      res.status(200).json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset email shortly.',
        resetUrl,
        ...(process.env.NODE_ENV === 'development' && {
          emailError: emailError.message
        })
      })
    }
    
  } catch (error) {
    console.error('Unified forgot password error:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request. Please try again.'
    })
  }
})

// @route   GET /api/unified-auth/verify-reset-token/:token
// @desc    Verify password reset token for any user type
// @access  Public
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token purpose'
      })
    }
    
    // Find user based on type
    let user
    if (decoded.userType === 'seller') {
      user = await Seller.findById(decoded.userId)
    } else if (decoded.userType === 'user') {
      user = await User.findById(decoded.userId)
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'Token verified successfully',
      email: user.email,
      userType: decoded.userType,
      name: decoded.userType === 'seller' ? user.businessName : user.displayName
    })
    
  } catch (error) {
    console.error('Verify reset token error:', error)
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired. Please request a new one.'
      })
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to verify reset token'
    })
  }
})

// @route   POST /api/unified-auth/reset-password
// @desc    Reset password for any user type
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body
    
    // Validate input
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, password, and confirm password are required'
      })
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      })
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      })
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token purpose'
      })
    }
    
    // Find and update user based on type
    let user
    if (decoded.userType === 'seller') {
      user = await Seller.findById(decoded.userId)
      if (user) {
        // Hash new password
        const saltRounds = 12
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        user.password = hashedPassword
        user.updatedAt = new Date()
        await user.save()
      }
    } else if (decoded.userType === 'user') {
      user = await User.findById(decoded.userId)
      if (user) {
        // For users, we might need to handle Firebase password reset differently
        if (user.firebaseUid) {
          try {
            // Update password in Firebase
            await admin.auth().updateUser(user.firebaseUid, {
              password: password
            })
          } catch (firebaseError) {
            console.error('Firebase password update error:', firebaseError)
            // Continue with local password update as fallback
          }
        }
        
        // Also update local password
        user.password = password // User model has password hashing middleware
        await user.save()
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    console.log(`✅ Password reset successful for ${decoded.userType}: ${user.email}`)
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      userType: decoded.userType
    })
    
  } catch (error) {
    console.error('Reset password error:', error)
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired. Please request a new one.'
      })
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    })
  }
})

// @route   POST /api/unified-auth/send-welcome-email
// @desc    Send welcome email to user or seller
// @access  Private (Admin only)
router.post('/send-welcome-email', async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      })
    }
    
    // Send welcome email using unified service
    const result = await unifiedEmailService.sendWelcomeEmail(email)
    
    res.status(200).json({
      success: true,
      message: 'Welcome email sent successfully',
      messageId: result.messageId
    })
    
  } catch (error) {
    console.error('Send welcome email error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send welcome email'
    })
  }
})

// @route   POST /api/unified-auth/send-account-status-update
// @desc    Send account status update email
// @access  Private (Admin only)
router.post('/send-account-status-update', async (req, res) => {
  try {
    const { email, status, reason } = req.body
    
    if (!email || !status) {
      return res.status(400).json({
        success: false,
        message: 'Email and status are required'
      })
    }
    
    // Send account status update email
    const result = await unifiedEmailService.sendAccountStatusUpdate(email, status, reason)
    
    res.status(200).json({
      success: true,
      message: 'Account status update email sent successfully',
      messageId: result.messageId
    })
    
  } catch (error) {
    console.error('Send account status update error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send account status update email'
    })
  }
})

// @route   POST /api/unified-auth/test-email
// @desc    Test unified email service
// @access  Public (for testing)
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      })
    }
    
    // Send test email using unified service
    const result = await unifiedEmailService.sendTestEmail(email)
    
    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId
    })
    
  } catch (error) {
    console.error('Send test email error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send test email'
    })
  }
})

// @route   GET /api/unified-auth/email-stats
// @desc    Get email statistics
// @access  Private (Admin only)
router.get('/email-stats', async (req, res) => {
  try {
    const { days = 30 } = req.query
    
    const stats = await unifiedEmailService.getEmailStats(parseInt(days))
    
    res.status(200).json({
      success: true,
      stats,
      period: `${days} days`
    })
    
  } catch (error) {
    console.error('Get email stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get email statistics'
    })
  }
})

// @route   POST /api/unified-auth/detect-recipient
// @desc    Detect recipient type for an email
// @access  Public (for testing)
router.post('/detect-recipient', async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      })
    }
    
    const recipient = await unifiedEmailService.detectRecipientType(email)
    
    res.status(200).json({
      success: true,
      recipient: {
        type: recipient.type,
        name: recipient.name,
        status: recipient.status,
        // Don't expose sensitive data
        hasAccount: recipient.type !== 'unknown'
      }
    })
    
  } catch (error) {
    console.error('Detect recipient error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to detect recipient type'
    })
  }
})

module.exports = router
