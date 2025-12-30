const express = require('express')
const Product = require('../models/Product')
const Order = require('../models/Order')
const User = require('../models/User')
const Admin = require('../models/Admin')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { sendSellerApprovalEmail, sendSellerRejectionEmail } = require('../utils/emailService')
const emailService = require('../services/emailService')
const { 
  validateProduct, 
  validateProductUpdate, 
  validateObjectId, 
  validatePagination 
} = require('../middleware/validation')

const router = express.Router()

// Generate JWT tokens
const generateTokens = (adminId) => {
  const accessToken = jwt.sign(
    { 
      userId: adminId, 
      role: 'admin'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  )
  
  const refreshToken = jwt.sign(
    { userId: adminId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  )
  
  return { accessToken, refreshToken }
}

// Admin Login Route (No authentication required)
// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      })
    }
    
    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [
        { username: username },
        { email: username }
      ],
      isActive: true
    }).select('+password')
    
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      })
    }
    
    // Check password
    const isPasswordValid = await admin.comparePassword(password)
    
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      })
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(admin._id)
    
    // Update refresh token and last login
    admin.refreshToken = refreshToken
    await admin.updateLastLogin()
    
    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: admin.toSafeObject(),
        accessToken,
        refreshToken
      }
    })
    
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    })
  }
})

// Admin authentication middleware
const verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }
    
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Check if it's admin token
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      })
    }
    
    req.user = { 
      _id: 'admin', 
      role: 'admin',
      username: decoded.username
    }
    next()
    
  } catch (error) {
    console.error('Admin token verification error:', error)
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}

// @route   GET /api/admin/validate-token
// @desc    Validate admin token
// @access  Private/Admin
router.get('/validate-token', verifyAdminToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    admin: req.user
  })
})

// All other routes require admin authentication
router.use(verifyAdminToken)

// Dashboard Statistics
// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    console.log('Admin stats endpoint called')
    
    // Return basic stats without database queries for now
    const basicStats = {
      success: true,
      stats: {
        overview: {
          totalUsers: 0,
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        },
        orders: {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          statusBreakdown: [],
          recent: []
        },
        products: {
          topSelling: []
        },
        users: {
          growth: []
        }
      }
    }
    
    // Try to get real data, but fallback to basic stats if there's an error
    try {
      // Check if models are available
      if (User && Product && Order) {
        console.log('Models are available, fetching real data...')
        
        const totalUsers = await User.countDocuments({ isActive: true })
        const totalProducts = await Product.countDocuments({ status: 'active' })
        const totalOrders = await Order.countDocuments()
        
        console.log('Counts:', { totalUsers, totalProducts, totalOrders })
        
        basicStats.stats.overview = {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue: 0,
          averageOrderValue: 0
        }
        
        // Get recent orders if possible
        const recentOrders = await Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .lean() // Use lean() for better performance
        
        basicStats.stats.orders.recent = recentOrders
        
        console.log('Successfully fetched real data')
      } else {
        console.log('Models not available, using basic stats')
      }
    } catch (dbError) {
      console.error('Database error, using basic stats:', dbError.message)
    }
    
    res.status(200).json(basicStats)

  } catch (error) {
    console.error('Get admin stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Product Management
// @route   GET /api/admin/products
// @desc    Get all products for admin
// @access  Private/Admin
router.get('/products', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query
    
    // Build query
    const query = {}
    
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
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query)
    ])
    
    const totalPages = Math.ceil(total / parseInt(limit))
    
    res.status(200).json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Get admin products error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    })
  }
})

// @route   POST /api/admin/products
// @desc    Create new product
// @access  Private/Admin
router.post('/products', async (req, res) => {
  try {
    const productData = req.body
    
    // Validate required fields first
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
    if (!productData.name || typeof productData.name !== 'string') {
      productData.name = 'Untitled Product'
    }
    productData.name = productData.name.trim()
    productData.price = parseFloat(productData.price)
    productData.stock = parseInt(productData.stock) || 0
    productData.status = 'active' // Ensure product is active and visible
    productData.isFeatured = Boolean(productData.isFeatured)
    
    // Generate SKU if not provided
    if (!productData.sku || productData.sku.trim() === '') {
      const timestamp = Date.now().toString().slice(-6)
      const random = Math.random().toString(36).substr(2, 4).toUpperCase()
      productData.sku = `PRD${timestamp}${random}`
    }
    
    // Generate slug from name
    productData.slug = (productData.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // Handle images - create proper image objects
    if (!productData.images || !Array.isArray(productData.images) || productData.images.length === 0) {
      productData.images = [{
        url: `${req.protocol}://${req.get('host')}/api/upload/placeholder/product-image`,
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
    if (productData.specifications && Array.isArray(productData.specifications)) {
      productData.specifications = productData.specifications.filter(s => s.key && s.value)
    } else {
      productData.specifications = []
    }
    
    // Handle tags
    if (productData.tags && Array.isArray(productData.tags)) {
      productData.tags = productData.tags.filter(t => t && t.trim())
    } else {
      productData.tags = []
    }
    
    // Handle dimensions
    if (productData.dimensions && typeof productData.dimensions === 'object') {
      productData.dimensions = {
        length: parseFloat(productData.dimensions.length) || 0,
        width: parseFloat(productData.dimensions.width) || 0,
        height: parseFloat(productData.dimensions.height) || 0,
        unit: 'cm'
      }
    }
    
    // Handle weight
    if (productData.weight) {
      productData.weight = {
        value: parseFloat(productData.weight) || 0,
        unit: 'kg'
      }
    }
    
    const product = new Product(productData)
    await product.save()
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    })

  } catch (error) {
    console.error('Create product error:', error)
    
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

// @route   PUT /api/admin/products/:id
// @desc    Update product
// @access  Private/Admin
router.put('/products/:id', validateObjectId('id'), validateProductUpdate, async (req, res) => {
  try {
    const updateData = req.body
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    })

  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    })
  }
})

// @route   DELETE /api/admin/products/:id
// @desc    Delete product
// @access  Private/Admin
router.delete('/products/:id', validateObjectId('id'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'discontinued', updatedAt: new Date() },
      { new: true }
    )
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'Product discontinued successfully',
      product
    })

  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    })
  }
})

// Order Management
// @route   GET /api/admin/orders
// @desc    Get all orders for admin
// @access  Private/Admin
router.get('/orders', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query
    
    // Build query
    const query = {}
    
    if (status) query.status = status
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerInfo.email': { $regex: search, $options: 'i' } },
        { 'customerInfo.name': { $regex: search, $options: 'i' } }
      ]
    }
    
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }
    
    // Build sort
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'displayName email customerId phoneNumber')
        .populate('items.product', 'name images')
        .populate('items.seller', 'businessName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ])
    
    const totalPages = Math.ceil(total / parseInt(limit))
    
    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Get admin orders error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    })
  }
})

// @route   PUT /api/admin/orders/:id
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id', validateObjectId('id'), async (req, res) => {
  try {
    const { status, note } = req.body
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      })
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: new Date(),
        ...(note && { statusHistory: { status, note, updatedBy: req.user._id, updatedAt: new Date() } })
      },
      { new: true }
    ).populate('user', 'displayName email')
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order
    })

  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    })
  }
})

// @route   PUT /api/admin/orders/:id/tracking
// @desc    Add tracking information to order
// @access  Private/Admin
router.put('/orders/:id/tracking', validateObjectId('id'), async (req, res) => {
  try {
    const { carrier, trackingNumber, estimatedDelivery } = req.body
    
    if (!carrier || !trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Carrier and tracking number are required'
      })
    }
    
    const order = await Order.findById(req.params.id)
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }
    
    await order.addTrackingInfo(carrier, trackingNumber, estimatedDelivery)
    
    // Update status to shipped if not already
    if (order.status === 'processing') {
      await order.updateStatus('shipped', 'Order shipped with tracking information', req.user._id)
    }
    
    res.status(200).json({
      success: true,
      message: 'Tracking information added successfully',
      order
    })

  } catch (error) {
    console.error('Add tracking info error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add tracking information'
    })
  }
})

// User/Customer Management
// @route   GET /api/admin/customers
// @desc    Get all customers for admin
// @access  Private/Admin
router.get('/customers', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query
    
    // Build query
    const query = {}
    
    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (status) query.isActive = status === 'active'
    
    // Build sort
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [customers, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-refreshToken -firebaseUid'),
      User.countDocuments(query)
    ])
    
    const totalPages = Math.ceil(total / parseInt(limit))
    
    res.status(200).json({
      success: true,
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Get customers error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers'
    })
  }
})

// Seller Management
// @route   GET /api/admin/sellers
// @desc    Get all sellers for admin
// @access  Private/Admin
router.get('/sellers', validatePagination, async (req, res) => {
  try {
    const Seller = require('../models/Seller')
    const {
      page = 1,
      limit = 20,
      search,
      status,
      includeDeleted = false,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query
    
    // Build query
    const query = {}
    
    // Exclude deleted sellers by default unless specifically requested
    if (!includeDeleted || includeDeleted === 'false') {
      query.isDeleted = { $ne: true }
    }
    
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (status) query.status = status
    
    // Build sort
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [sellers, total] = await Promise.all([
      Seller.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Seller.countDocuments(query)
    ])
    
    const totalPages = Math.ceil(total / parseInt(limit))
    
    res.status(200).json({
      success: true,
      sellers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Get sellers error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sellers'
    })
  }
})

// @route   PUT /api/admin/sellers/:id/approve
// @desc    Approve seller
// @access  Private/Admin
router.put('/sellers/:id/approve', validateObjectId('id'), async (req, res) => {
  try {
    const Seller = require('../models/Seller')
    const seller = await Seller.findById(req.params.id)
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      })
    }
    
    // Don't pass approvedBy to avoid ObjectId issues
    const defaultPassword = await seller.approve()
    
    // Send approval email using new email service
    let emailSent = false
    try {
      await emailService.sendSellerAccountApproval(
        seller.email,
        seller.businessName
      )
      emailSent = true
      console.log(`✅ Approval email sent to: ${seller.email}`)
    } catch (emailError) {
      console.error('❌ Failed to send approval email:', emailError.message)
      // Continue with approval even if email fails
    }
    
    res.status(200).json({
      success: true,
      message: 'Seller approved successfully',
      emailSent,
      seller
    })

  } catch (error) {
    console.error('Approve seller error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to approve seller'
    })
  }
})

// @route   PUT /api/admin/sellers/:id/reject
// @desc    Reject seller
// @access  Private/Admin
router.put('/sellers/:id/reject', validateObjectId('id'), async (req, res) => {
  try {
    const Seller = require('../models/Seller')
    const { reason } = req.body
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      })
    }
    
    const seller = await Seller.findById(req.params.id)
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      })
    }
    
    // Don't pass rejectedBy to avoid ObjectId issues
    await seller.reject(reason)
    
    // Send rejection email
    const emailSent = await sendSellerRejectionEmail(
      seller.email,
      seller.ownerName,
      seller.businessName,
      reason
    )
    
    res.status(200).json({
      success: true,
      message: 'Seller rejected successfully',
      emailSent,
      seller
    })

  } catch (error) {
    console.error('Reject seller error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reject seller'
    })
  }
})

// @route   DELETE /api/admin/sellers/:id
// @desc    Delete seller account
// @access  Private/Admin
router.delete('/sellers/:id', validateObjectId('id'), async (req, res) => {
  try {
    const Seller = require('../models/Seller')
    const Product = require('../models/Product')
    const Order = require('../models/Order')
    
    const seller = await Seller.findById(req.params.id)
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      })
    }
    
    console.log(`Admin deleting seller: ${seller.businessName} (${seller.email})`)
    
    // Check if seller has active orders
    const activeOrders = await Order.countDocuments({
      'items.seller': seller._id,
      status: { $in: ['pending', 'confirmed', 'processing', 'shipped'] }
    })
    
    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete seller with ${activeOrders} active orders. Please complete or cancel all orders first.`
      })
    }
    
    // Get seller's products and orders for cleanup
    const sellerProducts = await Product.find({ seller: seller._id })
    const sellerOrders = await Order.find({ 'items.seller': seller._id })
    
    console.log(`Seller has ${sellerProducts.length} products and ${sellerOrders.length} orders`)
    
    // Soft delete approach: deactivate products and mark seller as deleted
    if (sellerProducts.length > 0) {
      await Product.updateMany(
        { seller: seller._id },
        { 
          status: 'discontinued',
          updatedAt: new Date(),
          deletedReason: 'Seller account deleted'
        }
      )
      console.log(`Deactivated ${sellerProducts.length} products`)
    }
    
    // Mark seller as deleted instead of hard delete to preserve order history
    seller.isActive = false
    seller.isDeleted = true
    seller.deletedAt = new Date()
    seller.deletedBy = 'admin'
    seller.deletionReason = 'Admin deletion'
    await seller.save()
    
    // Send deletion notification email (optional)
    try {
      await emailService.sendSellerAccountDeletion(
        seller.email,
        seller.businessName
      )
      console.log(`Deletion notification sent to: ${seller.email}`)
    } catch (emailError) {
      console.error('Failed to send deletion email:', emailError.message)
      // Continue with deletion even if email fails
    }
    
    res.status(200).json({
      success: true,
      message: 'Seller account deleted successfully',
      deletedSeller: {
        id: seller._id,
        businessName: seller.businessName,
        email: seller.email,
        productsDeactivated: sellerProducts.length,
        totalOrders: sellerOrders.length
      }
    })

  } catch (error) {
    console.error('Delete seller error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete seller account'
    })
  }
})

// Email Management
// @route   GET /api/admin/emails
// @desc    Get email logs and statistics
// @access  Private/Admin
router.get('/emails', async (req, res) => {
  try {
    const { getEmailStats, getRecentEmails } = require('../utils/emailService')
    
    const {
      page = 1,
      limit = 20,
      emailType,
      status,
      startDate,
      endDate
    } = req.query
    
    // Build filters
    const filters = {}
    if (emailType) filters.emailType = emailType
    if (status) filters.status = status
    if (startDate || endDate) {
      filters.createdAt = {}
      if (startDate) filters.createdAt.$gte = new Date(startDate)
      if (endDate) filters.createdAt.$lte = new Date(endDate)
    }
    
    const [stats, recentEmails] = await Promise.all([
      getEmailStats(filters),
      getRecentEmails(parseInt(limit), filters)
    ])
    
    res.status(200).json({
      success: true,
      stats,
      emails: recentEmails
    })

  } catch (error) {
    console.error('Get email logs error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email logs'
    })
  }
})

module.exports = router