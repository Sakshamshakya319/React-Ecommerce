const express = require('express')
const Product = require('../models/Product')
const Order = require('../models/Order')
const jwt = require('jsonwebtoken')
const { verifyToken } = require('../middleware/auth')
const { validateObjectId } = require('../middleware/validation')

const router = express.Router()

// Admin authentication middleware (same as in admin.js)
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

// @route   POST /api/simple-reviews/product/:productId
// @desc    Add a review to a product (only if user purchased it)
// @access  Private
router.post('/product/:productId', verifyToken, validateObjectId('productId'), async (req, res) => {
  try {
    const { rating, title, comment } = req.body
    const productId = req.params.productId
    const userId = req.user._id

    console.log('=== REVIEW SUBMISSION START ===')
    console.log('Product ID:', productId)
    console.log('User ID:', userId)
    console.log('Rating:', rating)

    // Validate input
    if (!rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating, title, and comment are required'
      })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      })
    }

    // Check if user has purchased this product and it's delivered
    console.log('Checking if user purchased this product...')
    const purchasedOrder = await Order.findOne({
      user: userId,
      'items.product': productId,
      status: 'delivered'
    })

    if (!purchasedOrder) {
      console.log('User has not purchased this product or order not delivered')
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased and received'
      })
    }

    console.log('Found purchased order:', purchasedOrder.orderNumber)

    // Get the product
    const product = await Product.findById(productId).populate('seller', 'businessName email')
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Check if user has already reviewed this product
    const existingReview = product.reviews.find(review => 
      review.user.toString() === userId.toString()
    )

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      })
    }

    // Add the review
    const reviewData = {
      user: userId,
      rating: parseInt(rating),
      title: title.trim(),
      comment: comment.trim(),
      createdAt: new Date(),
      sellerReply: null // Initialize seller reply as null
    }

    console.log('Adding review to product...')
    await product.addReview(reviewData)

    console.log('Review added successfully')
    console.log('New rating average:', product.rating.average)
    console.log('Total reviews:', product.rating.count)

    // Populate user info for response
    await product.populate('reviews.user', 'displayName avatar')

    const addedReview = product.reviews[product.reviews.length - 1]

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review: addedReview,
      productRating: {
        average: product.rating.average,
        count: product.rating.count
      }
    })

    console.log('=== REVIEW SUBMISSION SUCCESS ===')

  } catch (error) {
    console.log('=== REVIEW SUBMISSION ERROR ===')
    console.error('Add review error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add review'
    })
  }
})

// @route   GET /api/simple-reviews/can-review/:productId
// @desc    Check if user can review a product
// @access  Private
router.get('/can-review/:productId', verifyToken, validateObjectId('productId'), async (req, res) => {
  try {
    const productId = req.params.productId
    const userId = req.user._id

    // Check if user has purchased this product and it's delivered
    const purchasedOrder = await Order.findOne({
      user: userId,
      'items.product': productId,
      status: 'delivered'
    })

    if (!purchasedOrder) {
      return res.status(200).json({
        success: true,
        canReview: false,
        reason: 'You can only review products you have purchased and received'
      })
    }

    // Check if user has already reviewed this product
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    const existingReview = product.reviews.find(review => 
      review.user.toString() === userId.toString()
    )

    if (existingReview) {
      return res.status(200).json({
        success: true,
        canReview: false,
        reason: 'You have already reviewed this product'
      })
    }

    res.status(200).json({
      success: true,
      canReview: true,
      orderId: purchasedOrder._id
    })

  } catch (error) {
    console.error('Check can review error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check review eligibility'
    })
  }
})

// @route   GET /api/simple-reviews/product/:productId
// @desc    Get reviews for a product
// @access  Public
router.get('/product/:productId', validateObjectId('productId'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate('reviews.user', 'displayName avatar')

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    res.status(200).json({
      success: true,
      reviews: product.reviews,
      rating: product.rating
    })

  } catch (error) {
    console.error('Get product reviews error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    })
  }
})

// @route   GET /api/simple-reviews/admin/all
// @desc    Get all reviews for admin
// @access  Private (Admin only)
router.get('/admin/all', verifyAdminToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    console.log('=== ADMIN FETCHING ALL REVIEWS ===')
    console.log('Page:', page, 'Limit:', limit, 'Status:', status)
    console.log('Admin user:', req.user.username)

    // Get all products with reviews
    const products = await Product.find({ 'reviews.0': { $exists: true } })
      .populate('reviews.user', 'displayName email avatar')
      .populate('seller', 'businessName email')
      .select('name images reviews seller')
      .sort({ 'reviews.createdAt': -1 })

    // Flatten all reviews with product info
    let allReviews = []
    products.forEach(product => {
      product.reviews.forEach(review => {
        allReviews.push({
          _id: review._id,
          productId: product._id,
          productName: product.name,
          productImage: product.images?.[0]?.url,
          seller: product.seller,
          user: review.user,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          sellerReply: review.sellerReply,
          createdAt: review.createdAt,
          hasReply: !!review.sellerReply
        })
      })
    })

    // Sort by creation date (newest first)
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Apply pagination
    const total = allReviews.length
    const paginatedReviews = allReviews.slice(skip, skip + parseInt(limit))

    console.log('Total reviews found:', total)
    console.log('Returning reviews:', paginatedReviews.length)

    res.status(200).json({
      success: true,
      reviews: paginatedReviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })

  } catch (error) {
    console.error('Get admin reviews error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    })
  }
})

// @route   GET /api/simple-reviews/admin/export
// @desc    Export all reviews to CSV
// @access  Private (Admin only)
router.get('/admin/export', verifyAdminToken, async (req, res) => {
  try {
    console.log('=== ADMIN EXPORTING REVIEWS ===')
    console.log('Admin user:', req.user.username)

    // Get all products with reviews
    const products = await Product.find({ 'reviews.0': { $exists: true } })
      .populate('reviews.user', 'displayName email')
      .populate('seller', 'businessName email')
      .select('name reviews seller')

    // Flatten all reviews with product info
    let allReviews = []
    products.forEach(product => {
      product.reviews.forEach(review => {
        allReviews.push({
          productName: product.name,
          sellerName: product.seller?.businessName || 'N/A',
          sellerEmail: product.seller?.email || 'N/A',
          customerName: review.user?.displayName || 'Anonymous',
          customerEmail: review.user?.email || 'N/A',
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          hasReply: !!review.sellerReply,
          sellerReply: review.sellerReply?.message || '',
          createdAt: review.createdAt,
          repliedAt: review.sellerReply?.repliedAt || ''
        })
      })
    })

    // Sort by creation date (newest first)
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Create CSV content
    const csvHeaders = [
      'Product Name',
      'Seller Name', 
      'Seller Email',
      'Customer Name',
      'Customer Email',
      'Rating',
      'Title',
      'Comment',
      'Has Reply',
      'Seller Reply',
      'Review Date',
      'Reply Date'
    ]

    const csvRows = allReviews.map(review => [
      `"${review.productName.replace(/"/g, '""')}"`,
      `"${review.sellerName.replace(/"/g, '""')}"`,
      `"${review.sellerEmail.replace(/"/g, '""')}"`,
      `"${review.customerName.replace(/"/g, '""')}"`,
      `"${review.customerEmail.replace(/"/g, '""')}"`,
      review.rating,
      `"${review.title.replace(/"/g, '""')}"`,
      `"${review.comment.replace(/"/g, '""')}"`,
      review.hasReply ? 'Yes' : 'No',
      `"${review.sellerReply.replace(/"/g, '""')}"`,
      new Date(review.createdAt).toISOString(),
      review.repliedAt ? new Date(review.repliedAt).toISOString() : ''
    ])

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n')

    console.log('Exporting', allReviews.length, 'reviews')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="reviews-export-${new Date().toISOString().split('T')[0]}.csv"`)
    res.send(csvContent)

  } catch (error) {
    console.error('Export reviews error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to export reviews'
    })
  }
})

// @route   GET /api/simple-reviews/seller/my-products
// @desc    Get reviews for seller's products
// @access  Private (Seller only)
router.get('/seller/my-products', verifyToken, async (req, res) => {
  try {
    // Check if user is seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Seller only.'
      })
    }

    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    console.log('=== SELLER FETCHING PRODUCT REVIEWS ===')
    console.log('Seller ID:', req.user._id)
    console.log('Page:', page, 'Limit:', limit)

    // Get seller's products with reviews
    const products = await Product.find({ 
      seller: req.user._id,
      'reviews.0': { $exists: true }
    })
      .populate('reviews.user', 'displayName email avatar')
      .select('name images reviews')
      .sort({ 'reviews.createdAt': -1 })

    // Flatten all reviews with product info
    let allReviews = []
    products.forEach(product => {
      product.reviews.forEach(review => {
        allReviews.push({
          _id: review._id,
          productId: product._id,
          productName: product.name,
          productImage: product.images?.[0]?.url,
          user: review.user,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          sellerReply: review.sellerReply,
          createdAt: review.createdAt,
          hasReply: !!review.sellerReply
        })
      })
    })

    // Sort by creation date (newest first)
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Apply pagination
    const total = allReviews.length
    const paginatedReviews = allReviews.slice(skip, skip + parseInt(limit))

    console.log('Total reviews found for seller:', total)
    console.log('Returning reviews:', paginatedReviews.length)

    res.status(200).json({
      success: true,
      reviews: paginatedReviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })

  } catch (error) {
    console.error('Get seller reviews error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    })
  }
})

// @route   POST /api/simple-reviews/seller/reply/:productId/:reviewId
// @desc    Seller reply to a review
// @access  Private (Seller only)
router.post('/seller/reply/:productId/:reviewId', verifyToken, validateObjectId('productId'), async (req, res) => {
  try {
    const { productId, reviewId } = req.params
    const { reply } = req.body

    console.log('=== SELLER REPLY TO REVIEW ===')
    console.log('Product ID:', productId)
    console.log('Review ID:', reviewId)
    console.log('Seller ID:', req.user._id)

    // Validate input
    if (!reply || !reply.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      })
    }

    // Get the product and verify seller ownership
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Check if user is the seller of this product
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only reply to reviews of your own products'
      })
    }

    // Find the review
    const review = product.reviews.id(reviewId)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      })
    }

    // Check if seller has already replied
    if (review.sellerReply) {
      return res.status(400).json({
        success: false,
        message: 'You have already replied to this review'
      })
    }

    // Add seller reply
    review.sellerReply = {
      message: reply.trim(),
      repliedAt: new Date(),
      repliedBy: req.user._id
    }

    await product.save()

    console.log('Seller reply added successfully')

    // Populate for response
    await product.populate('reviews.user', 'displayName avatar')

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      review: review
    })

  } catch (error) {
    console.error('Seller reply error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add reply'
    })
  }
})

module.exports = router