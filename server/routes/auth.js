const express = require('express')
const jwt = require('jsonwebtoken')
const admin = require('../config/firebase')
const User = require('../models/User')
const { verifyToken, authRateLimit } = require('../middleware/auth')
const { validateUserRegistration } = require('../middleware/validation')

const router = express.Router()

// Test endpoint to verify auth routes are working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth routes are working',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'POST /api/auth/register',
      'POST /api/auth/login', 
      'POST /api/auth/google-login',
      'POST /api/auth/firebase-login',
      'GET /api/auth/me'
    ]
  })
})

// Simple test for Google login endpoint accessibility
router.get('/google-test', (req, res) => {
  res.json({
    success: true,
    message: 'Google login endpoint is accessible',
    endpoint: 'POST /api/auth/google-login'
  })
})

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  )
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  )
  
  return { accessToken, refreshToken }
}

// @route   POST /api/auth/register
// @desc    Register new user with email/password
// @access  Public
router.post('/register', authRateLimit, validateUserRegistration, async (req, res) => {
  try {
    const { email, password, displayName, phoneNumber } = req.body
    
    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      })
    }
    
    // Create user in Firebase first (without phone number to avoid E.164 issues)
    let firebaseUser
    try {
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName
        // Note: Skipping phoneNumber for Firebase to avoid E.164 format issues
        // We'll store it in our database instead
      })
    } catch (firebaseError) {
      console.error('Firebase user creation error:', firebaseError)
      return res.status(400).json({
        success: false,
        message: 'Failed to create user account'
      })
    }
    
    // Create user in our database
    const customerId = User.generateCustomerId()
    
    const user = new User({
      firebaseUid: firebaseUser.uid,
      customerId,
      email,
      displayName,
      phoneNumber: phoneNumber || '',
      photoURL: '',
      isEmailVerified: false,
      role: 'user',
      provider: 'email'
    })
    
    await user.save()
    
    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user._id)
    
    // Save refresh token to user
    user.refreshToken = refreshToken
    await user.save()
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: user.toSafeObject(),
      token: accessToken
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    })
  }
})

// @route   POST /api/auth/login
// @desc    Login user with email/password (supports both Firebase and local auth)
// @access  Public
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }
    
    // Find user in our database
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      })
    }
    
    // Check if user has local password
    if (user.password) {
      // Use local password authentication
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password'
        })
      }
    } else {
      // For Firebase users without local password, we'll allow them to set one
      console.log('User has no local password, this is likely a Firebase/Google user')
    }
    
    // Update last login
    await user.updateLastLogin()
    
    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user._id)
    
    // Save refresh token to user
    user.refreshToken = refreshToken
    await user.save()
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: user.toSafeObject(),
      token: accessToken
    })
    
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed'
    })
  }
})

// @route   POST /api/auth/google-login
// @desc    Login/Register with Google via Firebase
// @access  Public
router.post('/google-login', async (req, res) => {
  console.log('Google login endpoint hit:', req.body)
  
  try {
    const { idToken, firebaseUser } = req.body
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      })
    }
    
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    
    // Ensure this is a Google sign-in (fix the condition)
    if (decodedToken.firebase.sign_in_provider !== 'google.com') {
      return res.status(400).json({
        success: false,
        message: 'Invalid sign-in provider'
      })
    }
    
    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { firebaseUid: decodedToken.uid },
        { email: decodedToken.email }
      ]
    })
    
    if (!user) {
      // Create new user
      const customerId = User.generateCustomerId()
      
      user = new User({
        firebaseUid: decodedToken.uid,
        customerId,
        email: decodedToken.email || firebaseUser.email,
        displayName: decodedToken.name || firebaseUser.displayName || 'User',
        phoneNumber: decodedToken.phone_number || firebaseUser.phoneNumber || '',
        photoURL: decodedToken.picture || firebaseUser.photoURL || '',
        isEmailVerified: decodedToken.email_verified || false,
        role: 'user',
        provider: 'google'
      })
      
      await user.save()
      console.log('New Google user created:', user.email)
    } else {
      // Update existing user
      if (!user.firebaseUid) {
        user.firebaseUid = decodedToken.uid
      }
      user.photoURL = decodedToken.picture || firebaseUser.photoURL || user.photoURL
      user.isEmailVerified = decodedToken.email_verified || user.isEmailVerified
      await user.updateLastLogin()
      console.log('Existing user logged in via Google:', user.email)
    }
    
    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user._id)
    
    // Save refresh token to user
    user.refreshToken = refreshToken
    await user.save()
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    
    res.status(200).json({
      success: true,
      message: 'Google login successful',
      user: user.toSafeObject(),
      token: accessToken // Use 'token' to match frontend expectation
    })
    
  } catch (error) {
    console.error('Google login error:', error)
    
    // Handle Firebase auth errors
    if (error.code && typeof error.code === 'string' && error.code.startsWith('auth/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Firebase token'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Google login failed'
    })
  }
})

// @route   POST /api/auth/firebase-login
// @desc    Login/Register with Firebase token
// @access  Public
router.post('/firebase-login', authRateLimit, async (req, res) => {
  try {
    const { idToken, firebaseUser } = req.body
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      })
    }
    
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    
    // Find or create user
    let user = await User.findByFirebaseUid(decodedToken.uid)
    
    if (!user) {
      // Create new user
      const customerId = User.generateCustomerId()
      
      user = new User({
        firebaseUid: decodedToken.uid,
        customerId,
        email: decodedToken.email || firebaseUser.email,
        displayName: decodedToken.name || firebaseUser.displayName || 'User',
        phoneNumber: decodedToken.phone_number || firebaseUser.phoneNumber || '',
        photoURL: decodedToken.picture || firebaseUser.photoURL || '',
        isEmailVerified: decodedToken.email_verified || false,
        role: 'user'
      })
      
      await user.save()
    } else {
      // Update existing user login info
      await user.updateLastLogin()
    }
    
    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user._id)
    
    // Save refresh token to user
    user.refreshToken = refreshToken
    await user.save()
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: user.toSafeObject(),
      accessToken
    })
    
  } catch (error) {
    console.error('Firebase login error:', error)
    
    // Handle Firebase auth errors
    if (error.code && typeof error.code === 'string' && error.code.startsWith('auth/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Firebase token'
      })
    }
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this Firebase account'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Google login failed'
    })
  }
})

// @route   PUT /api/auth/change-password
// @desc    Change password (works with local password system)
// @access  Private
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { newPassword } = req.body
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        })
    }

    // Update password in our local system
    user.password = newPassword
    await user.save()
    
    console.log(`Password changed successfully for user: ${user.email}`)
    
    res.status(200).json({
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

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found'
      })
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    
    // Find user and verify refresh token
    const user = await User.findById(decoded.userId)
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      })
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      })
    }
    
    // Generate new tokens
    const tokens = generateTokens(user._id)
    
    // Update refresh token
    user.refreshToken = tokens.refreshToken
    await user.save()
    
    // Set new refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    
    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      user: user.toSafeObject()
    })
    
  } catch (error) {
    console.error('Token refresh error:', error)
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    })
  }
})

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // Clear refresh token from database
    req.user.refreshToken = null
    await req.user.save()
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken')
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    })
    
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    })
  }
})

// @route   GET /api/auth/validate-token
// @desc    Validate current token
// @access  Private
router.get('/validate-token', verifyToken, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: req.user.toSafeObject()
    })
  } catch (error) {
    console.error('Token validation error:', error)
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    })
  }
})

// @route   GET /api/auth/validate-token
// @desc    Validate user token
// @access  Private
router.get('/validate-token', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    user: req.user.toSafeObject()
  })
})

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user.toSafeObject()
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    })
  }
})

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const {
      displayName,
      phoneNumber,
      profile,
      preferences
    } = req.body
    
    const updateData = {}
    
    if (displayName) updateData.displayName = displayName
    if (phoneNumber) updateData.phoneNumber = phoneNumber
    if (profile) updateData.profile = { ...req.user.profile, ...profile }
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    )
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.toSafeObject()
    })
    
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({
      success: false,
      message: 'Profile update failed'
    })
  }
})

// @route   POST /api/auth/address
// @desc    Add user address
// @access  Private
router.post('/address', verifyToken, async (req, res) => {
  try {
    const addressData = req.body
    
    await req.user.addAddress(addressData)
    
    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      user: req.user.toSafeObject()
    })
    
  } catch (error) {
    console.error('Add address error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add address'
    })
  }
})

// @route   PUT /api/auth/address/:addressId
// @desc    Update user address
// @access  Private
router.put('/address/:addressId', verifyToken, async (req, res) => {
  try {
    const { addressId } = req.params
    const updateData = req.body
    
    await req.user.updateAddress(addressId, updateData)
    
    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      user: req.user.toSafeObject()
    })
    
  } catch (error) {
    console.error('Update address error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update address'
    })
  }
})

// @route   DELETE /api/auth/address/:addressId
// @desc    Delete user address
// @access  Private
router.delete('/address/:addressId', verifyToken, async (req, res) => {
  try {
    const { addressId } = req.params
    
    await req.user.removeAddress(addressId)
    
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      user: req.user.toSafeObject()
    })
    
  } catch (error) {
    console.error('Delete address error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete address'
    })
  }
})

// @route   POST /api/auth/wishlist/:productId
// @desc    Add product to wishlist
// @access  Private
router.post('/wishlist/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params
    
    await req.user.addToWishlist(productId)
    
    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      user: req.user.toSafeObject()
    })
    
  } catch (error) {
    console.error('Add to wishlist error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add to wishlist'
    })
  }
})

// @route   DELETE /api/auth/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/wishlist/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params
    
    await req.user.removeFromWishlist(productId)
    
    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      user: req.user.toSafeObject()
    })
    
  } catch (error) {
    console.error('Remove from wishlist error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to remove from wishlist'
    })
  }
})

module.exports = router
