const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const path = require('path')
const admin = require('firebase-admin')
const Seller = require('../models/Seller')
const Product = require('../models/Product')
const Order = require('../models/Order')
const { validateObjectId, validatePagination } = require('../middleware/validation')
const emailService = require('../services/emailService')

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/seller-documents/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG) and PDF files are allowed'))
    }
  }
})

// Seller Registration
// @route   POST /api/seller/register
// @desc    Register new seller
// @access  Public
router.post('/register', upload.fields([
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'bankStatement', maxCount: 1 },
  { name: 'businessProof', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Seller registration request received:', Object.keys(req.body))
    
    const sellerData = req.body
    
    // Parse JSON fields if they exist
    if (sellerData.businessAddress && typeof sellerData.businessAddress === 'string') {
      try {
        sellerData.businessAddress = JSON.parse(sellerData.businessAddress)
      } catch (e) {
        console.log('businessAddress parsing failed, using as object')
      }
    }
    
    if (sellerData.bankDetails && typeof sellerData.bankDetails === 'string') {
      try {
        sellerData.bankDetails = JSON.parse(sellerData.bankDetails)
      } catch (e) {
        console.log('bankDetails parsing failed, using as object')
      }
    }
    
    if (sellerData.categories && typeof sellerData.categories === 'string') {
      try {
        sellerData.categories = JSON.parse(sellerData.categories)
      } catch (e) {
        console.log('categories parsing failed, using as array')
      }
    }
    
    // Validate required fields
    const requiredFields = ['businessName', 'ownerName', 'email', 'password', 'phone']
    const missingFields = requiredFields.filter(field => !sellerData[field])
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      })
    }
    
    // Set default values for optional fields to pass validation
    const processedData = {
      ...sellerData,
      // Ensure phone field is set correctly
      phone: sellerData.phone || sellerData.phoneNumber,
      // Set default business type if not provided
      businessType: sellerData.businessType || 'individual',
      // Set default business description if not provided
      businessDescription: sellerData.businessDescription || `${sellerData.businessName} - A business registered on our platform`,
      // Ensure categories is an array with valid values
      categories: Array.isArray(sellerData.categories) 
        ? sellerData.categories.filter(cat => ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Toys', 'Beauty', 'Automotive', 'Health', 'Jewelry'].includes(cat))
        : ['Electronics'], // Default category
      // Set default address if not provided
      businessAddress: sellerData.businessAddress || {
        street: sellerData.businessAddress?.street || 'Not provided',
        city: sellerData.businessAddress?.city || 'Not provided',
        state: sellerData.businessAddress?.state || 'Not provided',
        pincode: sellerData.businessAddress?.pincode || '110001',
        country: 'India'
      },
      // Set default bank details if not provided
      bankDetails: sellerData.bankDetails || {
        accountHolderName: sellerData.ownerName,
        accountNumber: 'Not provided',
        ifscCode: 'SBIN0000001',
        bankName: 'Not provided',
        branch: 'Not provided'
      }
    }
    
    // Clean up GST and PAN - remove if empty
    if (!processedData.gstNumber || processedData.gstNumber.trim() === '') {
      delete processedData.gstNumber
    }
    if (!processedData.panNumber || processedData.panNumber.trim() === '') {
      delete processedData.panNumber
    }
    
    console.log('Processed seller data:', {
      businessName: processedData.businessName,
      email: processedData.email,
      phone: processedData.phone,
      businessType: processedData.businessType,
      categories: processedData.categories
    })
    
    // Handle file uploads
    if (req.files) {
      processedData.documents = {}
      Object.keys(req.files).forEach(key => {
        if (req.files[key] && req.files[key][0]) {
          processedData.documents[key] = req.files[key][0].path
        }
      })
    }
    
    // Check if seller already exists
    const existingSeller = await Seller.findOne({
      $or: [
        { email: processedData.email },
        ...(processedData.gstNumber && processedData.gstNumber.trim() ? [{ gstNumber: processedData.gstNumber }] : []),
        ...(processedData.panNumber && processedData.panNumber.trim() ? [{ panNumber: processedData.panNumber }] : [])
      ]
    })
    
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: 'Seller with this email, GST, or PAN already exists'
      })
    }
    
    // Hash password before saving
    if (processedData.password) {
      const saltRounds = 12
      processedData.password = await bcrypt.hash(processedData.password, saltRounds)
    }
    
    // Create seller
    const seller = new Seller({
      ...processedData,
      status: 'pending', // Admin needs to approve
      applicationDate: new Date()
    })
    
    await seller.save()
    
    console.log('Seller created successfully:', seller._id)
    
    // Send welcome email (don't block registration if email fails)
    try {
      await emailService.sendSellerWelcomeEmail(
        seller.email,
        seller.businessName
      )
      console.log(`✅ Welcome email sent to: ${seller.email}`)
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError.message)
      // Continue with registration even if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Seller registration submitted successfully. We will review your application within 2-3 business days.',
      sellerId: seller._id
    })
    
  } catch (error) {
    console.error('Seller registration error:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    })
  }
})

// Seller Login
// @route   POST /api/seller/login
// @desc    Seller login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    // Find seller by email
    const seller = await Seller.findOne({ email }).select('+password')
    
    if (!seller) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }
    
    // Check if seller is approved
    if (seller.status !== 'approved') {
      return res.status(401).json({
        success: false,
        message: `Your seller account is ${seller.status}. Please contact support.`
      })
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, seller.password)
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }
    
    // Create JWT token with proper structure
    const token = jwt.sign(
      { 
        userId: seller._id,  // Use userId instead of sellerId for consistency
        sellerId: seller._id, // Keep sellerId for backward compatibility
        role: 'seller',
        businessName: seller.businessName
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    // Remove password from response
    seller.password = undefined
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      seller
    })
    
  } catch (error) {
    console.error('Seller login error:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed'
    })
  }
})

// Firebase Login
// @route   POST /api/seller/firebase-login
// @desc    Seller Firebase login
// @access  Public
router.post('/firebase-login', async (req, res) => {
  try {
    const { idToken, email, displayName, photoURL, provider } = req.body
    
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    const firebaseUid = decodedToken.uid
    const firebaseEmail = decodedToken.email
    
    // Ensure email matches
    if (firebaseEmail !== email) {
      return res.status(400).json({
        success: false,
        message: 'Email mismatch'
      })
    }
    
    // Find seller by email or Firebase UID
    let seller = await Seller.findOne({
      $or: [
        { email: firebaseEmail },
        { firebaseUid: firebaseUid }
      ]
    })
    
    if (!seller) {
      return res.status(401).json({
        success: false,
        message: 'No seller account found. Please register first or contact support.'
      })
    }
    
    // Check if seller is approved
    if (seller.status !== 'approved') {
      return res.status(401).json({
        success: false,
        message: `Your seller account is ${seller.status}. Please contact support.`
      })
    }
    
    // Update seller with Firebase info if not already set
    let updated = false
    if (!seller.firebaseUid) {
      seller.firebaseUid = firebaseUid
      updated = true
    }
    if (displayName && !seller.displayName) {
      seller.displayName = displayName
      updated = true
    }
    if (photoURL && !seller.photoURL) {
      seller.photoURL = photoURL
      updated = true
    }
    if (provider && !seller.authProvider) {
      seller.authProvider = provider
      updated = true
    }
    
    if (updated) {
      await seller.save()
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        sellerId: seller._id,
        role: 'seller',
        businessName: seller.businessName,
        firebaseUid: firebaseUid
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    res.status(200).json({
      success: true,
      message: 'Firebase login successful',
      token,
      seller: {
        ...seller.toObject(),
        password: undefined
      }
    })
    
  } catch (error) {
    console.error('Firebase login error:', error)
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Firebase token expired. Please login again.'
      })
    }
    res.status(500).json({
      success: false,
      message: 'Firebase login failed'
    })
  }
})

// Forgot Password (Traditional)
// @route   POST /api/seller/forgot-password
// @desc    Send password reset email for traditional auth
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
    
    // Find seller by email
    const seller = await Seller.findOne({ email })
    
    if (!seller) {
      // For security, don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset email shortly.'
      })
    }
    
    // Check if seller is approved
    if (seller.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Your seller account is not approved. Please contact support.'
      })
    }
    
    // Generate reset token
    const resetToken = jwt.sign(
      { 
        sellerId: seller._id,
        email: seller.email,
        purpose: 'password-reset'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    )
    
    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/seller/reset-password?token=${resetToken}`
    
    try {
      // Send password reset email
      await emailService.sendSellerPasswordReset(
        seller.email,
        seller.businessName,
        resetUrl
      )
      
      console.log(`✅ Password reset email sent to: ${seller.email}`)
      
      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully. Please check your inbox.',
        // Remove this in production - only for development/testing
        ...(process.env.NODE_ENV === 'development' && { 
          resetUrl,
          debug: {
            email: seller.email,
            businessName: seller.businessName
          }
        })
      })
      
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError.message)
      
      // Log the error but don't expose email service issues to user
      res.status(200).json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset email shortly.',
        // In development, show the actual error
        ...(process.env.NODE_ENV === 'development' && {
          emailError: emailError.message,
          resetUrl // Provide URL for testing even if email fails
        })
      })
    }
    
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request. Please try again.'
    })
  }
})

// Verify Reset Token
// @route   GET /api/seller/verify-reset-token/:token
// @desc    Verify password reset token
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
    
    // Find seller
    const seller = await Seller.findById(decoded.sellerId)
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'Token verified successfully',
      email: seller.email
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

// Reset Password (Traditional)
// @route   POST /api/seller/reset-password
// @desc    Reset password using token
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
    
    // Find seller
    const seller = await Seller.findById(decoded.sellerId)
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      })
    }
    
    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    // Update password
    seller.password = hashedPassword
    seller.updatedAt = new Date()
    await seller.save()
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
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

// Seller authentication middleware
const verifySellerToken = async (req, res, next) => {
  try {
    console.log('Verifying seller token...')
    const authHeader = req.headers.authorization
    
    console.log('Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found')
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }
    
    const token = authHeader.substring(7)
    console.log('Token extracted, length:', token.length)
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log('Token decoded:', { sellerId: decoded.sellerId, role: decoded.role })
    
    // Check if it's seller token
    if (decoded.role !== 'seller') {
      console.log('Invalid role:', decoded.role)
      return res.status(403).json({
        success: false,
        message: 'Seller access required'
      })
    }
    
    // Find seller
    const seller = await Seller.findById(decoded.sellerId)
    console.log('Seller found:', seller ? seller.businessName : 'Not found')
    
    if (!seller || seller.status !== 'approved') {
      console.log('Seller not found or not approved:', seller?.status)
      return res.status(401).json({
        success: false,
        message: 'Seller account not found or not approved'
      })
    }
    
    req.seller = seller
    console.log('Seller authentication successful')
    next()
    
  } catch (error) {
    console.error('Seller token verification error:', error)
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}

// Protected seller routes
router.use(verifySellerToken)

// Change Password
// @route   PUT /api/seller/change-password
// @desc    Change seller password
// @access  Private/Seller
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body
    const sellerId = req.seller._id
    
    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      })
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      })
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      })
    }
    
    // Get seller with password
    const seller = await Seller.findById(sellerId).select('+password')
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      })
    }
    
    // Check if seller has a password (might be Firebase-only user)
    if (!seller.password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for Firebase-authenticated accounts. Please use Firebase to reset your password.'
      })
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, seller.password)
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }
    
    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)
    
    // Update password
    seller.password = hashedNewPassword
    seller.updatedAt = new Date()
    await seller.save()
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    })
    
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    })
  }
})

// Get Seller Profile
// @route   GET /api/seller/profile
// @desc    Get seller profile information
// @access  Private/Seller
router.get('/profile', async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id)
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      })
    }
    
    res.status(200).json({
      success: true,
      seller: {
        ...seller.toObject(),
        password: undefined
      }
    })
    
  } catch (error) {
    console.error('Get seller profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    })
  }
})

// Update Seller Profile
// @route   PUT /api/seller/profile
// @desc    Update seller profile information
// @access  Private/Seller
router.put('/profile', async (req, res) => {
  try {
    const sellerId = req.seller._id
    const updateData = req.body
    
    // Remove sensitive fields that shouldn't be updated via this route
    delete updateData.password
    delete updateData.firebaseUid
    delete updateData.status
    delete updateData.approvalDate
    delete updateData.approvedBy
    
    // Update seller
    const updatedSeller = await Seller.findByIdAndUpdate(
      sellerId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    
    if (!updatedSeller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      seller: {
        ...updatedSeller.toObject(),
        password: undefined
      }
    })
    
  } catch (error) {
    console.error('Update seller profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    })
  }
})

// Test endpoint to verify seller authentication
router.get('/test-auth', (req, res) => {
  res.json({
    success: true,
    message: 'Seller authentication working',
    seller: {
      id: req.seller._id,
      businessName: req.seller.businessName,
      status: req.seller.status
    }
  })
})

// Test Email Service
// @route   POST /api/seller/test-email
// @desc    Test email service functionality
// @access  Private/Seller
router.post('/test-email', async (req, res) => {
  try {
    const { testType = 'basic' } = req.body
    const seller = req.seller
    
    let result
    
    switch (testType) {
      case 'password-reset':
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/seller/reset-password?token=test-token`
        result = await emailService.sendSellerPasswordReset(
          seller.email,
          seller.businessName,
          resetUrl
        )
        break
        
      case 'welcome':
        result = await emailService.sendSellerWelcomeEmail(
          seller.email,
          seller.businessName
        )
        break
        
      case 'approval':
        result = await emailService.sendSellerAccountApproval(
          seller.email,
          seller.businessName
        )
        break
        
      default:
        result = await emailService.sendTestEmail(seller.email)
    }
    
    res.status(200).json({
      success: true,
      message: `Test email (${testType}) sent successfully`,
      messageId: result.messageId,
      recipient: seller.email
    })
    
  } catch (error) {
    console.error('Test email error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    })
  }
})

// Seller Dashboard Stats
// @route   GET /api/seller/stats
// @desc    Get seller dashboard statistics
// @access  Private/Seller
router.get('/stats', async (req, res) => {
  try {
    const sellerId = req.seller._id
    
    const [
      totalProducts,
      totalOrders,
      orderStats,
      recentOrders,
      topProducts
    ] = await Promise.all([
      // Total products by this seller
      Product.countDocuments({ seller: sellerId, status: 'active' }),
      
      // Total orders containing this seller's products
      Order.countDocuments({ 'items.seller': sellerId }),
      
      // Order statistics for this seller
      Order.aggregate([
        { $match: { 'items.seller': sellerId } },
        { $unwind: '$items' },
        { $match: { 'items.seller': sellerId } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            totalItemsSold: { $sum: '$items.quantity' },
            averageOrderValue: { $avg: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        }
      ]),
      
      // Recent orders containing this seller's products
      Order.find({ 'items.seller': sellerId })
        .populate('user', 'displayName email customerId')
        .populate('items.product', 'name')
        .populate('items.seller', 'businessName')
        .sort({ createdAt: -1 })
        .limit(5),
      
      // Top selling products by this seller
      Product.find({ seller: sellerId, status: 'active' })
        .sort({ salesCount: -1 })
        .limit(5)
        .select('name salesCount price images')
    ])
    
    const stats = orderStats[0] || { 
      totalRevenue: 0, 
      averageOrderValue: 0, 
      totalItemsSold: 0 
    }
    
    // Filter recent orders to show only seller's items
    const filteredRecentOrders = recentOrders.map(order => {
      const orderObj = order.toObject()
      orderObj.items = orderObj.items.filter(item => 
        item.seller && item.seller._id.toString() === sellerId.toString()
      )
      return orderObj
    })
    
    res.status(200).json({
      success: true,
      totalProducts,
      totalOrders,
      totalRevenue: stats.totalRevenue,
      averageOrderValue: stats.averageOrderValue,
      totalItemsSold: stats.totalItemsSold,
      profileViews: Math.floor(Math.random() * 1000), // Placeholder
      recentOrders: filteredRecentOrders,
      topProducts
    })
    
  } catch (error) {
    console.error('Get seller stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    })
  }
})

// Update order status (seller can update their items)
// @route   PUT /api/seller/orders/:orderId/status
// @desc    Update order status for seller's items
// @access  Private/Seller
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params
    const { status, note } = req.body
    const sellerId = req.seller._id
    
    console.log('Updating order status:', { orderId, status, sellerId })
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      })
    }
    
    // Find the order and check if seller has items in it
    const order = await Order.findById(orderId)
      .populate('user', 'displayName email phoneNumber customerId')
      .populate('items.product', 'name images sku')
      .populate('items.seller', 'businessName')
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }
    
    // Check if seller has items in this order
    const hasSellerItems = order.items.some(item => 
      item.seller && item.seller._id.toString() === sellerId.toString()
    )
    
    if (!hasSellerItems) {
      return res.status(403).json({
        success: false,
        message: 'You can only update orders containing your products'
      })
    }
    
    // Update order status
    const updateNote = note || `Status updated to ${status} by seller: ${req.seller.businessName}`
    await order.updateStatus(status, updateNote, sellerId)
    
    // Add status history entry specifically for seller update
    order.statusHistory.push({
      status: status,
      timestamp: new Date(),
      note: updateNote,
      updatedBy: sellerId,
      updatedByType: 'seller'
    })
    
    await order.save()
    
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        user: {
          displayName: order.user?.displayName,
          email: order.user?.email,
          phoneNumber: order.user?.phoneNumber,
          customerId: order.user?.customerId
        },
        items: order.items.filter(item => 
          item.seller && item.seller._id.toString() === sellerId.toString()
        ),
        statusHistory: order.statusHistory,
        updatedAt: order.updatedAt
      }
    })
    
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    })
  }
})

// Seller Analytics
// @route   GET /api/seller/analytics
// @desc    Get seller analytics data
// @access  Private/Seller
router.get('/analytics', async (req, res) => {
  try {
    const { days = 30 } = req.query
    const sellerId = req.seller._id
    
    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))
    
    const [
      totalProducts,
      totalOrders,
      orderStats,
      topProducts,
      ordersByStatus,
      revenueByMonth
    ] = await Promise.all([
      // Total products by this seller
      Product.countDocuments({ seller: sellerId, status: 'active' }),
      
      // Total orders containing this seller's products in date range
      Order.countDocuments({ 
        'items.seller': sellerId,
        createdAt: { $gte: startDate }
      }),
      
      // Order statistics for this seller in date range
      Order.aggregate([
        { 
          $match: { 
            'items.seller': sellerId,
            createdAt: { $gte: startDate }
          } 
        },
        { $unwind: '$items' },
        { $match: { 'items.seller': sellerId } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            totalItemsSold: { $sum: '$items.quantity' },
            averageOrderValue: { $avg: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        }
      ]),
      
      // Top selling products by this seller
      Product.find({ seller: sellerId, status: 'active' })
        .sort({ salesCount: -1 })
        .limit(10)
        .select('name salesCount price images'),
      
      // Orders by status
      Order.aggregate([
        { 
          $match: { 
            'items.seller': sellerId,
            createdAt: { $gte: startDate }
          } 
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Revenue by month (last 12 months)
      Order.aggregate([
        { 
          $match: { 
            'items.seller': sellerId,
            createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
          } 
        },
        { $unwind: '$items' },
        { $match: { 'items.seller': sellerId } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ])
    
    const stats = orderStats[0] || { 
      totalRevenue: 0, 
      averageOrderValue: 0, 
      totalItemsSold: 0 
    }
    
    // Format orders by status
    const ordersByStatusFormatted = {}
    ordersByStatus.forEach(item => {
      ordersByStatusFormatted[item._id] = item.count
    })
    
    res.status(200).json({
      success: true,
      totalProducts,
      totalOrders,
      totalRevenue: stats.totalRevenue,
      averageOrderValue: stats.averageOrderValue,
      totalItemsSold: stats.totalItemsSold,
      topProducts,
      ordersByStatus: ordersByStatusFormatted,
      revenueByMonth,
      dateRange: {
        days: parseInt(days),
        startDate,
        endDate: new Date()
      }
    })
    
  } catch (error) {
    console.error('Get seller analytics error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    })
  }
})

// Test endpoint to verify seller data
// @route   GET /api/seller/test-data
// @desc    Test seller data access
// @access  Private/Seller
router.get('/test-data', async (req, res) => {
  try {
    const sellerId = req.seller._id
    
    // Check products
    const products = await Product.find({ seller: sellerId }).limit(5)
    
    // Check orders
    const orders = await Order.find({ 'items.seller': sellerId }).limit(5)
    
    // Check if seller exists in any order items
    const orderItemsWithSeller = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      { $limit: 5 },
      { $project: { 
        orderNumber: 1, 
        'items.name': 1, 
        'items.seller': 1,
        'items.price': 1
      }}
    ])
    
    res.json({
      success: true,
      seller: {
        id: sellerId.toString(),
        businessName: req.seller.businessName,
        status: req.seller.status
      },
      data: {
        products: products.length,
        orders: orders.length,
        orderItems: orderItemsWithSeller.length,
        sampleProducts: products.map(p => ({
          name: p.name,
          price: p.price,
          updatedAt: p.updatedAt
        })),
        sampleOrderItems: orderItemsWithSeller
      }
    })
    
  } catch (error) {
    console.error('Test data error:', error)
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    })
  }
})

// Debug endpoint to check orders with seller info
// @route   GET /api/seller/debug/orders
// @desc    Debug seller orders
// @access  Private/Seller
router.get('/debug/orders', async (req, res) => {
  try {
    const sellerId = req.seller._id
    console.log('Debug: Checking orders for seller:', sellerId)
    
    // Find all orders
    const allOrders = await Order.find({}).populate('items.product').populate('items.seller')
    console.log('Debug: Total orders in system:', allOrders.length)
    
    // Find orders with seller items
    const ordersWithSellerItems = await Order.find({
      'items.seller': sellerId
    }).populate('items.product').populate('items.seller')
    
    console.log('Debug: Orders with seller items:', ordersWithSellerItems.length)
    
    // Check if any orders have items without seller field
    const ordersWithoutSeller = await Order.find({
      'items.seller': { $exists: false }
    })
    
    console.log('Debug: Orders without seller field:', ordersWithoutSeller.length)
    
    res.status(200).json({
      success: true,
      debug: {
        sellerId,
        totalOrders: allOrders.length,
        ordersWithSellerItems: ordersWithSellerItems.length,
        ordersWithoutSeller: ordersWithoutSeller.length,
        sampleOrders: allOrders.slice(0, 2).map(order => ({
          id: order._id,
          items: order.items.map(item => ({
            product: item.product?._id,
            seller: item.seller,
            name: item.name
          }))
        }))
      }
    })
    
  } catch (error) {
    console.error('Debug orders error:', error)
    res.status(500).json({
      success: false,
      message: 'Debug failed'
    })
  }
})

// Seller Orders
// @route   GET /api/seller/orders
// @desc    Get seller orders (only orders containing seller's products)
// @access  Private/Seller
router.get('/orders', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query
    
    const sellerId = req.seller._id
    console.log('Fetching orders for seller:', sellerId)
    
    // Build query to find orders that contain this seller's products
    const query = {
      'items.seller': sellerId
    }
    
    if (status) query.status = status
    
    console.log('Order query:', JSON.stringify(query))
    
    // Build sort
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    // First, let's check if there are any orders at all
    const totalOrdersInSystem = await Order.countDocuments({})
    console.log('Total orders in system:', totalOrdersInSystem)
    
    // Check orders with seller items
    const ordersWithSellerItems = await Order.countDocuments(query)
    console.log('Orders with seller items:', ordersWithSellerItems)
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'displayName email customerId phoneNumber') // Added phoneNumber
        .populate('items.product', 'name images sku')
        .populate('items.seller', 'businessName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ])
    
    console.log('Found orders:', orders.length)
    
    // Filter items to only show this seller's products in each order
    const filteredOrders = orders.map(order => {
      const orderObj = order.toObject()
      
      // Filter items to only include this seller's products
      orderObj.items = orderObj.items.filter(item => {
        const itemSellerId = item.seller?._id?.toString() || item.seller?.toString()
        const currentSellerId = sellerId.toString()
        return itemSellerId === currentSellerId
      })
      
      // Recalculate totals for seller's items only
      const sellerSubtotal = orderObj.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      )
      
      orderObj.sellerSubtotal = sellerSubtotal
      orderObj.sellerItemCount = orderObj.items.length
      
      console.log(`Order ${orderObj.orderNumber}: ${orderObj.items.length} seller items, subtotal: ${sellerSubtotal}`)
      
      return orderObj
    })
    
    const totalPages = Math.ceil(total / parseInt(limit))
    
    res.status(200).json({
      success: true,
      orders: filteredOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      },
      debug: {
        sellerId: sellerId.toString(),
        totalOrdersInSystem,
        ordersWithSellerItems,
        foundOrders: orders.length
      }
    })
    
  } catch (error) {
    console.error('Get seller orders error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    })
  }
})

// @route   POST /api/seller/products
// @desc    Create new product (seller)
// @access  Private/Seller
router.post('/products', async (req, res) => {
  try {
    console.log('Seller product creation request:', {
      sellerId: req.seller._id,
      sellerName: req.seller.businessName,
      bodyKeys: Object.keys(req.body)
    })
    
    const productData = req.body
    
    // Add seller ID to product
    productData.seller = req.seller._id
    
    console.log('Product data prepared:', {
      name: productData.name,
      price: productData.price,
      category: productData.category,
      seller: productData.seller
    })
    
    // Validate required fields
    if (!productData.name || typeof productData.name !== 'string' || productData.name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Product name is required and must be a non-empty string'
      })
    }
    
    if (!productData.price || isNaN(parseFloat(productData.price))) {
      return res.status(400).json({
        success: false,
        message: 'Product price is required and must be a valid number'
      })
    }
    
    if (!productData.category || typeof productData.category !== 'string' || productData.category.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Product category is required'
      })
    }
    
    // Clean and prepare data
    productData.name = productData.name.trim()
    productData.price = parseFloat(productData.price)
    productData.stock = parseInt(productData.stock) || 0
    productData.status = 'active' // Seller products are active by default
    productData.isFeatured = false // Only admin can set featured products
    
    // Generate SKU if not provided
    if (!productData.sku || productData.sku.trim() === '') {
      const timestamp = Date.now().toString().slice(-6)
      const random = Math.random().toString(36).substr(2, 4).toUpperCase()
      const businessPrefix = (req.seller.businessName || 'SELLER').substr(0, 3).toUpperCase()
      productData.sku = `${businessPrefix}${timestamp}${random}`
    }
    
    // Generate slug from name
    let baseSlug = (productData.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // Ensure unique slug
    let slug = baseSlug
    let counter = 1
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }
    productData.slug = slug
    
    // Handle images - create proper image objects
    if (!productData.images || !Array.isArray(productData.images) || productData.images.length === 0) {
      // Use a local placeholder instead of external service
      productData.images = [{
        url: `/api/placeholder/product-image?text=${encodeURIComponent(productData.name)}`,
        alt: productData.name,
        isPrimary: true
      }]
    } else {
      // Ensure images have proper structure
      productData.images = productData.images.map((img, index) => ({
        url: img.url || img,
        alt: img.alt || productData.name,
        isPrimary: index === 0
      }))
    }
    
    // Handle features
    if (productData.features && Array.isArray(productData.features)) {
      productData.features = productData.features.filter(f => f && f.trim())
    } else {
      productData.features = []
    }
    
    // Handle specifications
    if (!productData.specifications || typeof productData.specifications !== 'object') {
      productData.specifications = {}
    }
    
    // Handle tags
    if (productData.tags && Array.isArray(productData.tags)) {
      productData.tags = productData.tags.filter(t => t && t.trim())
    } else {
      productData.tags = []
    }
    
    // Handle dimensions
    if (productData.specifications && productData.specifications.dimensions && typeof productData.specifications.dimensions === 'object') {
      productData.specifications.dimensions = {
        length: parseFloat(productData.specifications.dimensions.length) || 0,
        width: parseFloat(productData.specifications.dimensions.width) || 0,
        height: parseFloat(productData.specifications.dimensions.height) || 0,
        unit: productData.specifications.dimensions.unit || 'cm'
      }
    }
    
    // Handle weight
    if (productData.specifications && productData.specifications.weight) {
      productData.specifications.weight = {
        value: parseFloat(productData.specifications.weight.value) || 0,
        unit: productData.specifications.weight.unit || 'kg'
      }
    }
    
    console.log('Creating product with data:', {
      name: productData.name,
      slug: productData.slug,
      price: productData.price,
      category: productData.category,
      seller: productData.seller,
      sku: productData.sku
    })
    
    const product = new Product(productData)
    await product.save()
    
    console.log('Product created successfully:', product._id)
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    })

  } catch (error) {
    console.error('Create seller product error:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      })
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    })
  }
})

// Seller Products
// @route   GET /api/seller/products
// @desc    Get seller products
// @access  Private/Seller
router.get('/products', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      refresh = false
    } = req.query
    
    const sellerId = req.seller._id
    console.log('Fetching products for seller:', sellerId, 'refresh:', refresh)
    
    // Build query
    const query = { seller: sellerId }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (category) query.category = category
    if (status) query.status = status
    
    // Build sort
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    // Force fresh data from database (no cache)
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(), // Use lean() for better performance and fresh data
      Product.countDocuments(query)
    ])
    
    console.log(`Found ${products.length} products for seller`)
    
    // Log first product for debugging
    if (products.length > 0) {
      console.log('Sample product:', {
        name: products[0].name,
        price: products[0].price,
        updatedAt: products[0].updatedAt
      })
    }
    
    const totalPages = Math.ceil(total / parseInt(limit))
    
    res.status(200).json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      },
      timestamp: new Date().toISOString() // Add timestamp to verify fresh data
    })
    
  } catch (error) {
    console.error('Get seller products error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    })
  }
})

// Top Products
// @route   GET /api/seller/products/top
// @desc    Get top selling products
// @access  Private/Seller
router.get('/products/top', async (req, res) => {
  try {
    const { limit = 5 } = req.query
    const sellerId = req.seller._id
    
    const products = await Product.find({ 
      seller: sellerId, 
      status: 'active' 
    })
    .sort({ salesCount: -1 })
    .limit(parseInt(limit))
    .select('name salesCount price images')
    
    res.status(200).json({
      success: true,
      products
    })
    
  } catch (error) {
    console.error('Get top products error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top products'
    })
  }
})

// @route   PUT /api/seller/products/:id
// @desc    Update product (seller)
// @access  Private/Seller
router.put('/products/:id', validateObjectId('id'), async (req, res) => {
  try {
    const productId = req.params.id
    const sellerId = req.seller._id
    const updateData = req.body
    
    console.log('Seller product update request:', {
      productId,
      sellerId: sellerId.toString(),
      updateKeys: Object.keys(updateData)
    })
    
    // Find the product and verify ownership
    const existingProduct = await Product.findById(productId)
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    
    // Check if seller owns this product
    if (existingProduct.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own products'
      })
    }
    
    // Validate required fields
    if (updateData.name && (typeof updateData.name !== 'string' || updateData.name.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Product name must be a non-empty string'
      })
    }
    
    if (updateData.price && isNaN(parseFloat(updateData.price))) {
      return res.status(400).json({
        success: false,
        message: 'Product price must be a valid number'
      })
    }
    
    if (updateData.category && (typeof updateData.category !== 'string' || updateData.category.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Product category is required'
      })
    }
    
    // Clean and prepare update data
    const cleanUpdateData = { ...updateData }
    
    if (cleanUpdateData.name) {
      cleanUpdateData.name = cleanUpdateData.name.trim()
    }
    
    if (cleanUpdateData.price) {
      cleanUpdateData.price = parseFloat(cleanUpdateData.price)
    }
    
    if (cleanUpdateData.stock) {
      cleanUpdateData.stock = parseInt(cleanUpdateData.stock) || 0
    }
    
    // Update slug if name changed
    if (cleanUpdateData.name && cleanUpdateData.name !== existingProduct.name) {
      let baseSlug = cleanUpdateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      // Ensure unique slug
      let slug = baseSlug
      let counter = 1
      while (await Product.findOne({ slug, _id: { $ne: productId } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
      cleanUpdateData.slug = slug
    }
    
    // Handle images if provided
    if (cleanUpdateData.images && Array.isArray(cleanUpdateData.images)) {
      cleanUpdateData.images = cleanUpdateData.images.map((img, index) => ({
        url: img.url || img,
        alt: img.alt || cleanUpdateData.name || existingProduct.name,
        isPrimary: index === 0
      }))
    }
    
    // Handle features
    if (cleanUpdateData.features && Array.isArray(cleanUpdateData.features)) {
      cleanUpdateData.features = cleanUpdateData.features.filter(f => f && f.trim())
    }
    
    // Handle tags
    if (cleanUpdateData.tags && Array.isArray(cleanUpdateData.tags)) {
      cleanUpdateData.tags = cleanUpdateData.tags.filter(t => t && t.trim())
    }
    
    // Set updated timestamp
    cleanUpdateData.updatedAt = new Date()
    
    console.log('Updating product with data:', {
      productId,
      updateKeys: Object.keys(cleanUpdateData)
    })
    
    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      cleanUpdateData,
      { 
        new: true, 
        runValidators: true 
      }
    )
    
    console.log('Product updated successfully:', updatedProduct._id)
    
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    })

  } catch (error) {
    console.error('Update seller product error:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      })
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    })
  }
})

// @route   DELETE /api/seller/products/:id
// @desc    Delete/deactivate product (seller)
// @access  Private/Seller
router.delete('/products/:id', validateObjectId('id'), async (req, res) => {
  try {
    const productId = req.params.id
    const sellerId = req.seller._id
    
    console.log('Seller product delete request:', {
      productId,
      sellerId: sellerId.toString()
    })
    
    // Find the product and verify ownership
    const product = await Product.findById(productId)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    
    // Check if seller owns this product
    if (product.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own products'
      })
    }
    
    // Instead of hard delete, set status to inactive
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { 
        status: 'inactive',
        updatedAt: new Date()
      },
      { new: true }
    )
    
    console.log('Product deactivated successfully:', updatedProduct._id)
    
    res.status(200).json({
      success: true,
      message: 'Product deactivated successfully',
      product: updatedProduct
    })

  } catch (error) {
    console.error('Delete seller product error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    })
  }
})

// @route   GET /api/seller/products/:id
// @desc    Get single product for editing (seller)
// @access  Private/Seller
router.get('/products/:id', validateObjectId('id'), async (req, res) => {
  try {
    const productId = req.params.id
    const sellerId = req.seller._id
    
    console.log('Seller get product request:', {
      productId,
      sellerId: sellerId.toString()
    })
    
    // Find the product and verify ownership
    const product = await Product.findById(productId)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    
    // Check if seller owns this product
    if (product.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own products'
      })
    }
    
    res.status(200).json({
      success: true,
      product
    })

  } catch (error) {
    console.error('Get seller product error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    })
  }
})

module.exports = router