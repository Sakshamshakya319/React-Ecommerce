const express = require('express')
const Product = require('../models/Product')
const { verifyToken, optionalAuth } = require('../middleware/auth') // Using production auth
const { 
  validatePagination, 
  validateProductFilters,
  validateObjectId,
  validateReview
} = require('../middleware/validation')
const Order = require('../models/Order')

const router = express.Router()

// @route   GET /api/products
// @desc    Get all products with filtering, sorting, and pagination
// @access  Public
router.get('/', validatePagination, validateProductFilters, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subcategory,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured
    } = req.query

    // Build query
    const query = { status: 'active' }

    if (category) query.category = category
    if (subcategory) query.subcategory = subcategory
    if (featured === 'true') query.featured = true

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = parseFloat(minPrice)
      if (maxPrice) query.price.$lte = parseFloat(maxPrice)
    }

    // Text search
    if (search) {
      query.$text = { $search: search }
    }

    // Build sort object
    const sort = {}
    if (search) {
      sort.score = { $meta: 'textScore' }
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('reviews.user', 'displayName photoURL'),
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
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    })

  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    })
  }
})

// @route   GET /api/products/categories
// @desc    Get all product categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { status: 'active' })
    
    res.status(200).json({
      success: true,
      categories
    })

  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    })
  }
})

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query
    
    const products = await Product.getFeatured(parseInt(limit))
    
    res.status(200).json({
      success: true,
      products
    })

  } catch (error) {
    console.error('Get featured products error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products'
    })
  }
})

// @route   GET /api/products/search
// @desc    Search products
// @access  Public
router.get('/search', validatePagination, async (req, res) => {
  try {
    const { q: searchTerm, page = 1, limit = 12 } = req.query
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      })
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [products, total] = await Promise.all([
      Product.searchProducts(searchTerm, {
        skip,
        limit: parseInt(limit)
      }),
      Product.countDocuments({
        $text: { $search: searchTerm },
        status: 'active'
      })
    ])

    const totalPages = Math.ceil(total / parseInt(limit))

    res.status(200).json({
      success: true,
      products,
      searchTerm,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Search products error:', error)
    res.status(500).json({
      success: false,
      message: 'Search failed'
    })
  }
})

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', validateObjectId('id'), optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('reviews.user', 'displayName photoURL')
      .populate('seller', 'businessName businessType email')

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Increment view count (don't await to avoid slowing response)
    product.incrementViewCount().catch(err => 
      console.error('Failed to increment view count:', err)
    )

    res.status(200).json({
      success: true,
      product
    })

  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    })
  }
})

// @route   GET /api/products/category/:category
// @desc    Get products by category
// @access  Public
router.get('/category/:category', validatePagination, async (req, res) => {
  try {
    const { category } = req.params
    const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const [products, total] = await Promise.all([
      Product.findByCategory(category, {
        skip,
        limit: parseInt(limit),
        sort
      }),
      Product.countDocuments({ category, status: 'active' })
    ])

    const totalPages = Math.ceil(total / parseInt(limit))

    res.status(200).json({
      success: true,
      products,
      category,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Get products by category error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    })
  }
})

// @route   GET /api/products/:id/related
// @desc    Get related products
// @access  Public
router.get('/:id/related', validateObjectId('id'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Find related products in same category, excluding current product
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      status: 'active'
    })
    .limit(6)
    .sort({ 'rating.average': -1, salesCount: -1 })

    res.status(200).json({
      success: true,
      products: relatedProducts
    })

  } catch (error) {
    console.error('Get related products error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch related products'
    })
  }
})

// @route   POST /api/products/:id/reviews
// @desc    Add review to product
// @access  Private
router.post('/:id/reviews', verifyToken, validateObjectId('id'), validateReview, async (req, res) => {
  try {
    const { rating, title, comment } = req.body
    const productId = req.params.id
    const userId = req.user._id

    const product = await Product.findById(productId)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString()
    )

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'Product already reviewed'
      })
    }

    // Check if user bought the product
    const orders = await Order.find({ 
      user: userId, 
      'items.product': productId 
    })

    if (orders.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased'
      })
    }
    
    // Check if any order is not cancelled/refunded
    const validOrder = orders.find(o => !['cancelled', 'refunded'].includes(o.status))
    
    if (!validOrder) {
       return res.status(403).json({
        success: false,
        message: 'You can only review products from valid orders'
      })
    }

    const review = {
      user: userId,
      rating: Number(rating),
      title,
      comment,
      verified: true
    }

    product.reviews.push(review)

    // Update rating
    product.rating.count = product.reviews.length
    product.rating.average =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length

    await product.save()
    
    // Populate user info for the response
    await product.populate('reviews.user', 'displayName photoURL')

    res.status(201).json({
      success: true,
      message: 'Review added',
      reviews: product.reviews
    })

  } catch (error) {
    console.error('Add review error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add review'
    })
  }
})

module.exports = router
