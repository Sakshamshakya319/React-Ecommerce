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

// Google login test route that matches frontend expectations
router.post('/google-login', (req, res) => {
  try {
    console.log('Google login attempt:', req.body)
    
    const { idToken, firebaseUser } = req.body
    
    if (!idToken || !firebaseUser) {
      return res.status(400).json({
        success: false,
        message: 'Missing required data'
      })
    }
    
    // Return the exact structure the frontend expects
    res.json({
      success: true,
      message: 'Google login successful',
      user: {
        _id: 'test-user-id-123',
        customerId: 'CUST-TEST-001',
        email: firebaseUser.email || 'test@example.com',
        displayName: firebaseUser.displayName || 'Test User',
        photoURL: firebaseUser.photoURL || '',
        phoneNumber: firebaseUser.phoneNumber || '',
        isEmailVerified: true,
        role: 'user',
        provider: 'google',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-jwt-token-for-development'
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