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

// Helper function to generate proper mock JWT token
const generateMockToken = (userId, role = 'user') => {
  // Create a proper JWT-like structure (base64 encoded)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const payload = Buffer.from(JSON.stringify({ 
    userId, 
    role, 
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
  })).toString('base64')
  const signature = Buffer.from(`mock-signature-${userId}-${Date.now()}`).toString('base64')
  
  return `${header}.${payload}.${signature}`
}

// Helper function to decode mock JWT token
const decodeMockToken = (token) => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return payload
  } catch (error) {
    return null
  }
}

// Helper function to find user by token
const findUserByToken = (token) => {
  const decoded = decodeMockToken(token)
  if (!decoded) return null
  
  if (decoded.role === 'admin') {
    return mockAdmins.find(a => a._id === decoded.userId)
  } else if (decoded.role === 'seller') {
    return mockSellers.find(s => s._id === decoded.userId)
  } else {
    return mockUsers.find(u => u._id === decoded.userId)
  }
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
      'POST /api/auth/refresh',
      'GET /api/auth/validate-token',
      'GET /api/auth/me',
      'POST /api/auth/logout'
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

// Token Refresh
router.post('/refresh', (req, res) => {
  try {
    const authHeader = req.headers.authorization
    let token = null
    
    // Try to get token from Authorization header or cookies
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (req.cookies && req.cookies.refreshToken) {
      token = req.cookies.refreshToken
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found'
      })
    }

    const user = findUserByToken(token)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      })
    }

    // Generate new token
    const newToken = generateMockToken(user._id, user.role || 'user')

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      accessToken: newToken,
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    })
  }
})

// Validate Token
router.get('/validate-token', (req, res) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    const token = authHeader.substring(7)
    const user = findUserByToken(token)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: 'Token is valid',
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Token validation error:', error)
    res.status(401).json({
      success: false,
      message: 'Invalid token'
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
    const user = findUserByToken(token)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
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

// Change Password
router.put('/change-password', (req, res) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    const token = authHeader.substring(7)
    const user = findUserByToken(token)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }

    const { newPassword } = req.body
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
    }

    // Update password (in mock database)
    user.password = newPassword

    res.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update password'
    })
  }
})

module.exports = router