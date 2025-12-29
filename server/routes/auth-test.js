const express = require('express')
const router = express.Router()

// Mock user database (in production, this would be MongoDB)
const mockUsers = [
  {
    _id: 'user-123',
    customerId: 'CUST-001',
    email: 'user@test.com',
    password: 'password123', // In production, this would be hashed
    displayName: 'Test User',
    role: 'user',
    provider: 'email',
    isEmailVerified: true,
    createdAt: new Date().toISOString()
  }
]

const mockAdmins = [
  {
    _id: 'admin-123',
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Test Admin',
    role: 'admin',
    createdAt: new Date().toISOString()
  }
]

const mockSellers = [
  {
    _id: 'seller-123',
    email: 'seller@test.com',
    password: 'seller123',
    businessName: 'Test Store',
    contactPerson: 'Test Seller',
    role: 'seller',
    status: 'approved',
    createdAt: new Date().toISOString()
  }
]

// Helper function to generate mock JWT token
const generateMockToken = (userId, role = 'user') => {
  return `mock-jwt-token-${role}-${userId}-${Date.now()}`
}

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes working',
    availableEndpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/google-login',
      'POST /api/auth/admin-login',
      'POST /api/auth/seller-login'
    ]
  })
})

// User Registration
router.post('/register', (req, res) => {
  try {
    const { email, password, displayName, phoneNumber } = req.body

    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and display name are required'
      })
    }

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email)
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      })
    }

    // Create new user
    const newUser = {
      _id: `user-${Date.now()}`,
      customerId: `CUST-${Date.now()}`,
      email,
      password, // In production, hash this
      displayName,
      phoneNumber: phoneNumber || '',
      role: 'user',
      provider: 'email',
      isEmailVerified: false,
      createdAt: new Date().toISOString()
    }

    mockUsers.push(newUser)

    const token = generateMockToken(newUser._id, 'user')

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    })
  }
})

// User Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // Find user
    const user = mockUsers.find(u => u.email === email && u.password === password)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    const token = generateMockToken(user._id, 'user')

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed'
    })
  }
})

// Google Login
router.post('/google-login', (req, res) => {
  try {
    const { idToken, firebaseUser } = req.body

    if (!idToken || !firebaseUser) {
      return res.status(400).json({
        success: false,
        message: 'Missing required data'
      })
    }

    // Check if user exists
    let user = mockUsers.find(u => u.email === firebaseUser.email)

    if (!user) {
      // Create new user
      user = {
        _id: `user-google-${Date.now()}`,
        customerId: `CUST-${Date.now()}`,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Google User',
        photoURL: firebaseUser.photoURL || '',
        phoneNumber: firebaseUser.phoneNumber || '',
        role: 'user',
        provider: 'google',
        isEmailVerified: true,
        createdAt: new Date().toISOString()
      }
      mockUsers.push(user)
    }

    const token = generateMockToken(user._id, 'user')

    res.json({
      success: true,
      message: 'Google login successful',
      user,
      token
    })

  } catch (error) {
    console.error('Google login error:', error)
    res.status(500).json({
      success: false,
      message: 'Google login failed'
    })
  }
})

// Admin Login
router.post('/admin-login', (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // Find admin
    const admin = mockAdmins.find(a => a.email === email && a.password === password)
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin credentials'
      })
    }

    const token = generateMockToken(admin._id, 'admin')

    // Return admin without password
    const { password: _, ...adminWithoutPassword } = admin

    res.json({
      success: true,
      message: 'Admin login successful',
      admin: adminWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({
      success: false,
      message: 'Admin login failed'
    })
  }
})

// Seller Login
router.post('/seller-login', (req, res) => {
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
        message: 'Invalid seller credentials'
      })
    }

    if (seller.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Seller account is not approved yet'
      })
    }

    const token = generateMockToken(seller._id, 'seller')

    // Return seller without password
    const { password: _, ...sellerWithoutPassword } = seller

    res.json({
      success: true,
      message: 'Seller login successful',
      seller: sellerWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Seller login error:', error)
    res.status(500).json({
      success: false,
      message: 'Seller login failed'
    })
  }
})

// Get current user (for token validation)
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    const token = authHeader.substring(7)
    
    // Mock token validation - extract user info from token
    if (token.includes('user-')) {
      const userId = token.split('-')[3]
      const user = mockUsers.find(u => u._id.includes(userId))
      if (user) {
        const { password: _, ...userWithoutPassword } = user
        return res.json({
          success: true,
          user: userWithoutPassword
        })
      }
    }

    res.status(401).json({
      success: false,
      message: 'Invalid token'
    })

  } catch (error) {
    console.error('Token validation error:', error)
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    })
  }
})

// Logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  })
})

module.exports = router