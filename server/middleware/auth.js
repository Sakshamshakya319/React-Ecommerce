const jwt = require('jsonwebtoken')
const admin = require('../config/firebase')
const User = require('../models/User')
const Seller = require('../models/Seller')

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }
    
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    let user = null
    
    // Check user based on role
    if (decoded.role === 'seller') {
      user = await Seller.findById(decoded.userId).select('-password')
    } else {
      user = await User.findById(decoded.userId).select('-refreshToken')
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      })
    }
    
    // Add user to request object
    req.user = user
    next()
    
  } catch (error) {
    console.error('Token verification error:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      })
    }
    
    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    })
  }
}

// Verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Firebase token required'
      })
    }
    
    const idToken = authHeader.substring(7)
    
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    
    // Find user by Firebase UID
    const user = await User.findByFirebaseUid(decodedToken.uid)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      })
    }
    
    // Add user and Firebase token to request object
    req.user = user
    req.firebaseUser = decodedToken
    next()
    
  } catch (error) {
    console.error('Firebase token verification error:', error)
    
    return res.status(401).json({
      success: false,
      message: 'Invalid Firebase token'
    })
  }
}

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    // Convert single role to array
    const requiredRoles = Array.isArray(roles) ? roles : [roles]
    
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }
    
    next()
  }
}

// Check if user is admin
const requireAdmin = requireRole(['admin'])

// Check if user is admin or moderator
const requireModerator = requireRole(['admin', 'moderator'])

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next() // Continue without authentication
    }
    
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-refreshToken')
    
    if (user && user.isActive) {
      req.user = user
    }
    
    next()
    
  } catch (error) {
    // Continue without authentication if token is invalid
    next()
  }
}

// Check if user owns resource or is admin
const requireOwnershipOrAdmin = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next()
    }
    
    // Check if user owns the resource
    const resource = req.resource || req.body || req.params
    const resourceUserId = resource[resourceUserField]
    
    if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    next()
  }
}

// Rate limiting for authentication routes
const authRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = {
  verifyToken,
  verifyFirebaseToken,
  requireRole,
  requireAdmin,
  requireModerator,
  optionalAuth,
  requireOwnershipOrAdmin,
  authRateLimit,
  verifyAnyToken: async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Access token required' })
      }
      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      if (decoded.sellerId || decoded.role === 'seller') {
        const seller = await Seller.findById(decoded.sellerId)
        if (!seller || seller.status !== 'approved') {
          return res.status(401).json({ success: false, message: 'Seller account not found or not approved' })
        }
        req.seller = seller
        return next()
      }
      if (decoded.userId) {
        const user = await User.findById(decoded.userId).select('-refreshToken')
        if (!user) {
          return res.status(401).json({ success: false, message: 'User not found' })
        }
        if (!user.isActive) {
          return res.status(401).json({ success: false, message: 'Account is deactivated' })
        }
        req.user = user
        return next()
      }
      return res.status(403).json({ success: false, message: 'Invalid token payload' })
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' })
    }
  }
}
