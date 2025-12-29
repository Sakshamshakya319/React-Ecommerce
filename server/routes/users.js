const express = require('express')
const User = require('../models/User')
const { verifyToken, requireAdmin } = require('../middleware/auth-test') // Using test auth
const { validateUserUpdate, validateObjectId, validatePagination } = require('../middleware/validation')

const router = express.Router()

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist', 'name price images')
      .select('-refreshToken')
    
    res.status(200).json({
      success: true,
      user: user.toSafeObject()
    })

  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    })
  }
})

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', verifyToken, validateUserUpdate, async (req, res) => {
  try {
    const updateData = req.body
    
    // Remove sensitive fields that shouldn't be updated via this route
    delete updateData.firebaseUid
    delete updateData.customerId
    delete updateData.role
    delete updateData.refreshToken
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-refreshToken')
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.toSafeObject()
    })

  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    })
  }
})

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      })
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      })
    }
    
    const user = await User.findById(req.user._id).select('+password')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    // Check if current password is correct
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }
    
    // Update password
    user.password = newPassword
    await user.save()
    
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

// @route   GET /api/users/download-data
// @desc    Download user's account data
// @access  Private
router.get('/download-data', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist', 'name price images')
      .select('-refreshToken -password')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    // Prepare user data for download
    const userData = {
      accountInfo: {
        customerId: user.customerId,
        email: user.email,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin
      },
      profile: user.profile || {},
      addresses: user.addresses || [],
      preferences: user.preferences || {},
      wishlist: user.wishlist || [],
      accountStatus: {
        isActive: user.isActive,
        role: user.role
      },
      exportInfo: {
        exportDate: new Date().toISOString(),
        exportedBy: user.email,
        dataVersion: '1.0'
      }
    }
    
    // Set headers for file download
    const filename = `account-data-${user.customerId}-${new Date().toISOString().split('T')[0]}.json`
    
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Cache-Control', 'no-cache')
    
    res.status(200).json(userData)

  } catch (error) {
    console.error('Download data error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to download account data'
    })
  }
})

// @route   DELETE /api/users/profile
// @desc    Delete user account
// @access  Private
router.delete('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    // Instead of hard delete, we'll deactivate the account
    // This preserves data integrity for orders, reviews, etc.
    await User.findByIdAndUpdate(req.user._id, {
      isActive: false,
      deletedAt: new Date(),
      email: `deleted_${Date.now()}_${user.email}`, // Prevent email conflicts
      displayName: 'Deleted User'
    })
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    })

  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    })
  }
})

// @route   GET /api/users/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/wishlist', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'wishlist',
        select: 'name price images rating category status',
        match: { status: 'active' }
      })
    
    res.status(200).json({
      success: true,
      wishlist: user.wishlist
    })

  } catch (error) {
    console.error('Get wishlist error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist'
    })
  }
})

// @route   POST /api/users/wishlist/:productId
// @desc    Add product to wishlist
// @access  Private
router.post('/wishlist/:productId', verifyToken, validateObjectId('productId'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    await user.addToWishlist(req.params.productId)
    
    // Return updated wishlist with populated data
    const updatedUser = await User.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name price images rating category status',
      match: { status: 'active' }
    })

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      wishlist: updatedUser.wishlist
    })

  } catch (error) {
    console.error('Add to wishlist error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add to wishlist'
    })
  }
})

// @route   DELETE /api/users/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/wishlist/:productId', verifyToken, validateObjectId('productId'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    await user.removeFromWishlist(req.params.productId)
    
    // Return updated wishlist with populated data
    const updatedUser = await User.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name price images rating category status',
      match: { status: 'active' }
    })

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist: updatedUser.wishlist
    })

  } catch (error) {
    console.error('Remove from wishlist error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to remove from wishlist'
    })
  }
})

// Admin routes

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', verifyToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      role, 
      isActive,
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
    
    if (role) query.role = role
    if (isActive !== undefined) query.isActive = isActive === 'true'
    
    // Build sort
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-refreshToken -firebaseUid')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('orderCount'),
      User.countDocuments(query)
    ])
    
    const totalPages = Math.ceil(total / parseInt(limit))
    
    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    })
  }
})

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', verifyToken, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-refreshToken')
      .populate('wishlist', 'name price')
      .populate('orderCount')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    res.status(200).json({
      success: true,
      user: user.toSafeObject()
    })

  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    })
  }
})

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private/Admin
router.put('/:id', verifyToken, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const updateData = req.body
    
    // Remove sensitive fields
    delete updateData.firebaseUid
    delete updateData.refreshToken
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-refreshToken')
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser.toSafeObject()
    })

  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    })
  }
})

// @route   DELETE /api/users/:id
// @desc    Deactivate user (Admin only)
// @access  Private/Admin
router.delete('/:id', verifyToken, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    ).select('-refreshToken')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      user: user.toSafeObject()
    })

  } catch (error) {
    console.error('Deactivate user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user'
    })
  }
})

// @route   PUT /api/users/:id/activate
// @desc    Activate user (Admin only)
// @access  Private/Admin
router.put('/:id/activate', verifyToken, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true, updatedAt: new Date() },
      { new: true }
    ).select('-refreshToken')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      user: user.toSafeObject()
    })

  } catch (error) {
    console.error('Activate user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to activate user'
    })
  }
})

// @route   GET /api/users/customer/:customerId
// @desc    Get user by customer ID (Admin only)
// @access  Private/Admin
router.get('/customer/:customerId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { customerId } = req.params
    
    const user = await User.findByCustomerId(customerId)
      .select('-refreshToken')
      .populate('orderCount')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      })
    }
    
    res.status(200).json({
      success: true,
      user: user.toSafeObject()
    })

  } catch (error) {
    console.error('Get customer error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer'
    })
  }
})

module.exports = router