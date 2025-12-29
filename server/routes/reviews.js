const express = require('express')
const Review = require('../models/Review')
const Product = require('../models/Product')
const Order = require('../models/Order')
const { verifyToken } = require('../middleware/auth')
const { validateObjectId } = require('../middleware/validation')

const router = express.Router()

// @route   GET /api/reviews/product/:productId
// @desc    Get reviews for a product
// @access  Public
router.get('/product/:productId', validateObjectId('productId'), async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query
    const productId = req.params.productId
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [reviews, total, stats] = await Promise.all([
      Review.find({ product: productId, status: 'approved' })
        .populate('user', 'displayName avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ product: productId, status: 'approved' }),
      Review.getProductRatingStats(productId)
    ])
    
    const totalPages = Math.ceil(total / parseInt(limit))
    
    res.status(200).json({
      success: true,
      reviews,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Get product reviews error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    })
  }
})

// @route   GET /api/reviews/user
// @desc    Get user's reviews
// @access  Private
router.get('/user', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [reviews, total] = await Promise.all([
      Review.find({ user: req.user._id })
        .populate('product', 'name images')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ user: req.user._id })
    ])
    
    const totalPages = Math.ceil(total / parseInt(limit))
    
    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Get user reviews error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    })
  }
})

// @route   GET /api/reviews/can-review/:productId
// @desc    Check if user can review a product
// @access  Private
router.get('/can-review/:productId', verifyToken, validateObjectId('productId'), async (req, res) => {
  try {
    const result = await Review.canUserReview(req.user._id, req.params.productId)
    
    res.status(200).json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Check can review error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check review eligibility'
    })
  }
})

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', verifyToken, async (req, res) => {
  try {
    const { productId, orderId, rating, title, comment, images } = req.body
    
    // Validate required fields
    if (!productId || !orderId || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, Order ID, rating, title, and comment are required'
      })
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      })
    }
    
    // Check if user can review this product
    const canReview = await Review.canUserReview(req.user._id, productId)
    if (!canReview.canReview) {
      return res.status(400).json({
        success: false,
        message: canReview.reason
      })
    }
    
    // Verify the order belongs to the user and contains the product
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      'items.product': productId,
      status: 'delivered'
    })
    
    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order or product not found in delivered orders'
      })
    }
    
    // Create review
    const review = new Review({
      user: req.user._id,
      product: productId,
      order: orderId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      images: images || []
    })
    
    await review.save()
    
    // Update product rating
    await updateProductRating(productId)
    
    // Populate review for response
    await review.populate('user', 'displayName avatar')
    
    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    })

  } catch (error) {
    console.error('Create review error:', error)
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product for this order'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create review'
    })
  }
})

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private
router.put('/:id', verifyToken, validateObjectId('id'), async (req, res) => {
  try {
    const { rating, title, comment, images } = req.body
    
    const review = await Review.findById(req.params.id)
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      })
    }
    
    // Check if user owns this review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    // Update fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        })
      }
      review.rating = rating
    }
    
    if (title !== undefined) review.title = title.trim()
    if (comment !== undefined) review.comment = comment.trim()
    if (images !== undefined) review.images = images
    
    await review.save()
    
    // Update product rating if rating changed
    if (rating !== undefined) {
      await updateProductRating(review.product)
    }
    
    // Populate review for response
    await review.populate('user', 'displayName avatar')
    
    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    })

  } catch (error) {
    console.error('Update review error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    })
  }
})

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete('/:id', verifyToken, validateObjectId('id'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      })
    }
    
    // Check if user owns this review or is admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    const productId = review.product
    await Review.findByIdAndDelete(req.params.id)
    
    // Update product rating
    await updateProductRating(productId)
    
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    })

  } catch (error) {
    console.error('Delete review error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    })
  }
})

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', verifyToken, validateObjectId('id'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      })
    }
    
    await review.markHelpful(req.user._id)
    
    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      helpfulVotes: review.helpfulVotes
    })

  } catch (error) {
    console.error('Mark helpful error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to mark review as helpful'
    })
  }
})

// @route   DELETE /api/reviews/:id/helpful
// @desc    Unmark review as helpful
// @access  Private
router.delete('/:id/helpful', verifyToken, validateObjectId('id'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      })
    }
    
    await review.unmarkHelpful(req.user._id)
    
    res.status(200).json({
      success: true,
      message: 'Review unmarked as helpful',
      helpfulVotes: review.helpfulVotes
    })

  } catch (error) {
    console.error('Unmark helpful error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to unmark review as helpful'
    })
  }
})

// @route   GET /api/reviews/order/:orderId/reviewable-products
// @desc    Get products from an order that can be reviewed
// @access  Private
router.get('/order/:orderId/reviewable-products', verifyToken, validateObjectId('orderId'), async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id,
      status: 'delivered'
    }).populate('items.product', 'name images')
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not delivered'
      })
    }
    
    // Get existing reviews for this order
    const existingReviews = await Review.find({
      user: req.user._id,
      order: req.params.orderId
    }).select('product')
    
    const reviewedProductIds = existingReviews.map(review => review.product.toString())
    
    // Filter out already reviewed products
    const reviewableProducts = order.items
      .filter(item => !reviewedProductIds.includes(item.product._id.toString()))
      .map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price
      }))
    
    res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt
      },
      reviewableProducts
    })

  } catch (error) {
    console.error('Get reviewable products error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviewable products'
    })
  }
})

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const stats = await Review.getProductRatingStats(productId)
    
    await Product.findByIdAndUpdate(productId, {
      rating: stats.averageRating,
      reviews: stats.totalReviews
    })
  } catch (error) {
    console.error('Update product rating error:', error)
  }
}

module.exports = router