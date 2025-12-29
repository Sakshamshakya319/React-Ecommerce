// Test auth middleware that works with our mock JWT tokens

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

// Mock user databases - these will be updated when users login
const mockUsers = []
const mockAdmins = [
  {
    _id: 'admin-123',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'admin'
  }
]
const mockSellers = [
  {
    _id: 'seller-123',
    email: 'seller@test.com',
    businessName: 'Test Store',
    role: 'seller',
    status: 'approved'
  }
]

// Function to add user to mock database (called from auth routes)
const addMockUser = (user) => {
  const existingIndex = mockUsers.findIndex(u => u._id === user._id || u.email === user.email)
  if (existingIndex >= 0) {
    mockUsers[existingIndex] = user
  } else {
    mockUsers.push(user)
  }
  console.log('Mock user added/updated:', user.email)
  console.log('Total mock users:', mockUsers.length)
}

// Verify JWT token (test version)
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }
    
    const token = authHeader.substring(7)
    const decoded = decodeMockToken(token)
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      })
    }
    
    // Find user based on role
    let user = null
    if (decoded.role === 'admin') {
      user = mockAdmins.find(a => a._id === decoded.userId)
    } else if (decoded.role === 'seller') {
      user = mockSellers.find(s => s._id === decoded.userId)
    } else {
      user = mockUsers.find(u => u._id === decoded.userId)
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }
    
    // Attach user to request
    req.user = user
    next()
    
  } catch (error) {
    console.error('Token verification error:', error)
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    })
  }
}

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = decodeMockToken(token)
      
      if (decoded) {
        let user = null
        if (decoded.role === 'admin') {
          user = mockAdmins.find(a => a._id === decoded.userId)
        } else if (decoded.role === 'seller') {
          user = mockSellers.find(s => s._id === decoded.userId)
        } else {
          user = mockUsers.find(u => u._id === decoded.userId)
        }
        
        if (user) {
          req.user = user
        }
      }
    }
    
    next()
  } catch (error) {
    // Don't fail on optional auth
    next()
  }
}

// Rate limiting (mock - just passes through)
const authRateLimit = (req, res, next) => {
  next()
}

// Require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    })
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    })
  }
  
  next()
}

module.exports = {
  verifyToken,
  optionalAuth,
  authRateLimit,
  requireAdmin,
  addMockUser
}