const express = require('express')
const router = express.Router()

// Mock seller database
const mockSellers = [
  {
    _id: 'seller-123',
    email: 'seller@test.com',
    password: 'seller123',
    businessName: 'Test Store',
    contactPerson: 'Test Seller',
    phone: '+1234567890',
    role: 'seller',
    status: 'approved',
    businessType: 'retail',
    createdAt: new Date().toISOString()
  }
]

// Helper function to generate mock JWT token
const generateMockToken = (sellerId) => {
  return `mock-seller-jwt-token-${sellerId}-${Date.now()}`
}

// Seller Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // Find seller
    const seller = mockSellers.find(s => s.email === email && s.password === password)

    if (!seller) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    if (seller.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your seller account is pending approval'
      })
    }

    const token = generateMockToken(seller._id)

    // Return seller without password
    const { password: _, ...sellerWithoutPassword } = seller

    res.json({
      success: true,
      message: 'Login successful',
      seller: sellerWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Seller login error:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed'
    })
  }
})

// Seller Firebase Login
router.post('/firebase-login', (req, res) => {
  try {
    const { idToken, email, displayName, photoURL, provider } = req.body

    if (!idToken || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required data'
      })
    }

    // Check if seller exists
    let seller = mockSellers.find(s => s.email === email)

    if (!seller) {
      // Create new seller (would need approval in real app)
      seller = {
        _id: `seller-firebase-${Date.now()}`,
        email,
        businessName: displayName || 'Firebase Store',
        contactPerson: displayName || 'Firebase Seller',
        photoURL: photoURL || '',
        role: 'seller',
        status: 'approved', // Auto-approve for testing
        provider: provider || 'google',
        createdAt: new Date().toISOString()
      }
      mockSellers.push(seller)
    }

    if (seller.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your seller account is pending approval'
      })
    }

    const token = generateMockToken(seller._id)

    res.json({
      success: true,
      message: 'Firebase login successful',
      seller,
      token
    })

  } catch (error) {
    console.error('Firebase login error:', error)
    res.status(500).json({
      success: false,
      message: 'Firebase login failed'
    })
  }
})

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Seller routes working',
    testCredentials: {
      email: 'seller@test.com',
      password: 'seller123'
    }
  })
})

// Mock seller dashboard data
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalProducts: 25,
      totalOrders: 45,
      totalRevenue: 5500,
      pendingOrders: 3,
      recentOrders: [],
      topProducts: []
    }
  })
})

module.exports = router