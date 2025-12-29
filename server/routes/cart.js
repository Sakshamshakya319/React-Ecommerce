const express = require('express')
const Cart = require('../models/Cart')
const Product = require('../models/Product')
const { verifyToken } = require('../middleware/auth-test') // Using test auth
const { validateCartItem, validateObjectId } = require('../middleware/validation')

const router = express.Router()

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOrCreateForUser(req.user._id)
    
    res.status(200).json({
      success: true,
      cart
    })

  } catch (error) {
    console.error('Get cart error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    })
  }
})

// @route   POST /api/cart/items
// @desc    Add item to cart
// @access  Private
router.post('/items', verifyToken, validateCartItem, async (req, res) => {
  const maxRetries = 3
  let retryCount = 0
  
  const addItemToCart = async () => {
    try {
      const { productId, quantity, variant } = req.body
      
      // Verify product exists and is available
      const product = await Product.findById(productId)
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        })
      }
      
      if (!product.isInStock(quantity)) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        })
      }
      
      // Determine price (variant price or product price)
      let price = product.price
      if (variant && product.variants.length > 0) {
        const productVariant = product.variants.find(v => 
          v.color === variant.color && v.material === variant.material
        )
        if (productVariant) {
          price = productVariant.price
        }
      }
      
      // Use atomic operation to add item to cart
      const cart = await Cart.findOneAndUpdate(
        { 
          user: req.user._id,
          'items.product': productId,
          'items.variant': variant
        },
        {
          $inc: { 'items.$.quantity': quantity },
          $set: { 
            'items.$.price': price,
            updatedAt: new Date(),
            lastActivity: new Date()
          }
        },
        { new: true }
      )
      
      if (!cart) {
        // Item doesn't exist, add new item
        const updatedCart = await Cart.findOneAndUpdate(
          { user: req.user._id },
          {
            $push: {
              items: {
                product: productId,
                quantity,
                variant,
                price,
                addedAt: new Date()
              }
            },
            $set: {
              updatedAt: new Date(),
              lastActivity: new Date()
            }
          },
          { 
            upsert: true, 
            new: true,
            runValidators: true
          }
        ).populate('items.product')
        
        // Recalculate totals
        updatedCart.calculateTotals()
        await updatedCart.save()
        
        return res.status(200).json({
          success: true,
          message: 'Item added to cart',
          cart: updatedCart
        })
      }
      
      // Populate and return updated cart
      await cart.populate('items.product')
      cart.calculateTotals()
      await cart.save()
      
      res.status(200).json({
        success: true,
        message: 'Item added to cart',
        cart
      })

    } catch (error) {
      if (error.name === 'VersionError' && retryCount < maxRetries) {
        retryCount++
        console.log(`Add to cart retry ${retryCount}/${maxRetries} for user ${req.user._id}`)
        
        // Exponential backoff
        const delay = Math.pow(2, retryCount - 1) * 100
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return addItemToCart()
      }
      
      console.error('Add to cart error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart'
      })
    }
  }
  
  return addItemToCart()
})

// @route   PUT /api/cart/items/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put('/items/:itemId', verifyToken, validateObjectId('itemId'), async (req, res) => {
  const maxRetries = 3
  let retryCount = 0
  
  const updateCartItem = async () => {
    try {
      const { itemId } = req.params
      const { quantity } = req.body
      
      if (!quantity || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        })
      }
      
      // If quantity is 0, remove the item
      if (quantity === 0) {
        const cart = await Cart.findOneAndUpdate(
          { user: req.user._id },
          {
            $pull: { items: { _id: itemId } },
            $set: {
              updatedAt: new Date(),
              lastActivity: new Date()
            }
          },
          { new: true }
        ).populate('items.product')
        
        if (!cart) {
          return res.status(404).json({
            success: false,
            message: 'Cart not found'
          })
        }
        
        cart.calculateTotals()
        await cart.save()
        
        return res.status(200).json({
          success: true,
          message: 'Item removed from cart',
          cart
        })
      }
      
      // Find cart and item first to verify stock
      const cart = await Cart.findOne({ user: req.user._id }).populate('items.product')
      
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        })
      }
      
      const cartItem = cart.items.id(itemId)
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart'
        })
      }
      
      // Verify stock availability
      const product = await Product.findById(cartItem.product._id || cartItem.product)
      if (!product || !product.isInStock(quantity)) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        })
      }
      
      // Update quantity using atomic operation
      const updatedCart = await Cart.findOneAndUpdate(
        { 
          user: req.user._id,
          'items._id': itemId
        },
        {
          $set: {
            'items.$.quantity': quantity,
            updatedAt: new Date(),
            lastActivity: new Date()
          }
        },
        { new: true }
      ).populate('items.product')
      
      if (!updatedCart) {
        return res.status(404).json({
          success: false,
          message: 'Failed to update cart item'
        })
      }
      
      updatedCart.calculateTotals()
      await updatedCart.save()
      
      res.status(200).json({
        success: true,
        message: 'Cart updated',
        cart: updatedCart
      })

    } catch (error) {
      if (error.name === 'VersionError' && retryCount < maxRetries) {
        retryCount++
        console.log(`Update cart retry ${retryCount}/${maxRetries} for user ${req.user._id}`)
        
        // Exponential backoff
        const delay = Math.pow(2, retryCount - 1) * 100
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return updateCartItem()
      }
      
      console.error('Update cart error:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update cart'
      })
    }
  }
  
  return updateCartItem()
})

// @route   DELETE /api/cart/items/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/items/:itemId', verifyToken, validateObjectId('itemId'), async (req, res) => {
  try {
    const { itemId } = req.params
    
    const cart = await Cart.findOne({ user: req.user._id })
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      })
    }
    
    await cart.removeItem(itemId)
    
    // Populate cart items
    await cart.populate('items.product')
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart
    })

  } catch (error) {
    console.error('Remove from cart error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart'
    })
  }
})

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      })
    }
    
    await cart.clearCart()
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart
    })

  } catch (error) {
    console.error('Clear cart error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    })
  }
})

// @route   POST /api/cart/sync
// @desc    Sync cart with client-side data
// @access  Private
router.post('/sync', verifyToken, async (req, res) => {
  const maxRetries = 3
  let retryCount = 0
  
  const syncCart = async () => {
    try {
      const { items } = req.body
      
      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'Items must be an array'
        })
      }
      
      // Use findOneAndUpdate with upsert to avoid version conflicts
      const cart = await Cart.findOneAndUpdate(
        { user: req.user._id },
        { 
          user: req.user._id,
          items: [],
          appliedCoupons: [],
          totalAmount: 0,
          discountAmount: 0,
          finalAmount: 0
        },
        { 
          upsert: true, 
          new: true,
          runValidators: true
        }
      )
      
      // Process items one by one to avoid conflicts
      const validItems = []
      
      for (const item of items) {
        try {
          const product = await Product.findById(item.product._id || item.product)
          
          if (product && product.isInStock(item.quantity)) {
            let price = product.price
            
            // Check for variant pricing
            if (item.variant && product.variants.length > 0) {
              const productVariant = product.variants.find(v => 
                v.color === item.variant.color && v.material === item.variant.material
              )
              if (productVariant) {
                price = productVariant.price
              }
            }
            
            validItems.push({
              product: product._id,
              quantity: item.quantity,
              variant: item.variant,
              price: price
            })
          }
        } catch (itemError) {
          console.warn('Skipping invalid item:', item, itemError.message)
        }
      }
      
      // Update cart with valid items using atomic operation
      const updatedCart = await Cart.findOneAndUpdate(
        { user: req.user._id },
        { 
          $set: { 
            items: validItems,
            updatedAt: new Date()
          }
        },
        { 
          new: true,
          runValidators: true
        }
      ).populate('items.product')
      
      // Recalculate totals
      await updatedCart.calculateTotals()
      await updatedCart.save()
      
      res.status(200).json({
        success: true,
        message: 'Cart synced successfully',
        cart: updatedCart
      })

    } catch (error) {
      if (error.name === 'VersionError' && retryCount < maxRetries) {
        retryCount++
        console.log(`Cart sync retry ${retryCount}/${maxRetries} for user ${req.user._id}`)
        
        // Exponential backoff: wait 100ms, 200ms, 400ms
        const delay = Math.pow(2, retryCount - 1) * 100
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return syncCart()
      }
      
      console.error('Cart sync error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to sync cart'
      })
    }
  }
  
  return syncCart()
})

// @route   POST /api/cart/coupon
// @desc    Apply coupon to cart
// @access  Private
router.post('/coupon', verifyToken, async (req, res) => {
  try {
    const { couponCode } = req.body
    
    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      })
    }
    
    const cart = await Cart.findOne({ user: req.user._id })
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      })
    }
    
    // Simple coupon validation (in real app, you'd have a Coupon model)
    const validCoupons = {
      'SAVE10': { discount: 10, type: 'percentage' },
      'WELCOME20': { discount: 20, type: 'percentage' },
      'FLAT5': { discount: 5, type: 'fixed' }
    }
    
    const coupon = validCoupons[couponCode.toUpperCase()]
    
    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon code'
      })
    }
    
    await cart.applyCoupon(couponCode.toUpperCase(), coupon.discount, coupon.type)
    
    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      cart
    })

  } catch (error) {
    console.error('Apply coupon error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply coupon'
    })
  }
})

// @route   DELETE /api/cart/coupon/:couponCode
// @desc    Remove coupon from cart
// @access  Private
router.delete('/coupon/:couponCode', verifyToken, async (req, res) => {
  try {
    const { couponCode } = req.params
    
    const cart = await Cart.findOne({ user: req.user._id })
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      })
    }
    
    await cart.removeCoupon(couponCode)
    
    res.status(200).json({
      success: true,
      message: 'Coupon removed successfully',
      cart
    })

  } catch (error) {
    console.error('Remove coupon error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to remove coupon'
    })
  }
})

module.exports = router