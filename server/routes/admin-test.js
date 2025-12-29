const express = require('express')
const router = express.Router()

// Mock admin database
const mockAdmins = [
  {
    _id: 'admin-123',
    username: 'admin',
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Test Admin',
    role: 'admin',
    permissions: ['all'],
    createdAt: new Date().toISOString()
  }
]

// Helper function to generate mock JWT token
const generateMockToken = (adminId) => {
  return `mock-admin-jwt-token-${adminId}-${Date.now()}`
}

// Admin Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      })
    }

    // Find admin by username or email
    const admin = mockAdmins.find(a => 
      (a.username === username || a.email === username) && a.password === password
    )

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    const token = generateMockToken(admin._id)

    // Return admin without password
    const { password: _, ...adminWithoutPassword } = admin

    res.json({
      success: true,
      message: 'Login successful',
      admin: adminWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed'
    })
  }
})

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes working',
    testCredentials: {
      username: 'admin',
      password: 'admin123'
    }
  })
})

// Mock admin dashboard data
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 150,
      totalOrders: 89,
      totalProducts: 45,
      totalRevenue: 12500,
      recentOrders: [],
      topProducts: []
    }
  })
})

module.exports = router