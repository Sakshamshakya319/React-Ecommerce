const express = require('express')
const router = express.Router()

// Simple test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth test route working',
    timestamp: new Date().toISOString()
  })
})

// Google login test route that doesn't use Firebase
router.post('/google-login', (req, res) => {
  try {
    console.log('Google login attempt:', req.body)
    
    // For now, return a mock response
    res.json({
      success: true,
      message: 'Google login endpoint working (test mode)',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User'
      },
      token: 'test-jwt-token'
    })
  } catch (error) {
    console.error('Google login error:', error)
    res.status(500).json({
      success: false,
      message: 'Google login failed'
    })
  }
})

module.exports = router