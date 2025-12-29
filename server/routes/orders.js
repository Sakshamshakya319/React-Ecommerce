const express = require('express')
const Order = require('../models/Order')
const Cart = require('../models/Cart')
const Product = require('../models/Product')
const { verifyToken } = require('../middleware/auth')
const { validateOrder, validateObjectId, validatePagination } = require('../middleware/validation')

const router = express.Router()

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', verifyToken, validateOrder, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      payment,
      notes
    } = req.body
    
    // Verify all items are available
    for (const item of items) {
      const product = await Product.findById(item.product)
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.name} not found`
        })
      }
      
      if (!product.isInStock(item.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        })
      }
    }
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.085 // 8.5% tax
    const shipping = subtotal >= 50 ? 0 : 9.99 // Free shipping over $50
    const total = subtotal + tax + shipping
    
    // Generate order number
    const orderNumber = Order.generateOrderNumber()
    console.log('Generated order number:', orderNumber)
    
    // Create order
    const order = new Order({
      orderNumber, // Use the generated order number
      user: req.user._id,
      customerInfo: {
        email: req.user.email,
        phone: req.user.phoneNumber,
        name: req.user.displayName
      },
      items: await Promise.all(items.map(async (item) => {
        // Fetch product to get seller information
        const product = await Product.findById(item.product).populate('seller')
        return {
          product: item.product,
          seller: product?.seller?._id || product?.seller, // Add seller field
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant,
          sku: item.sku,
          image: item.image
        }
      })),
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      payment: {
        method: payment.method,
        status: 'pending'
      },
      notes: {
        customer: notes?.customer || ''
      }
    })
    
    console.log('Order before save:', {
      orderNumber: order.orderNumber,
      user: order.user,
      total: order.total
    })
    
    await order.save()
    
    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { 
          $inc: { 
            stock: -item.quantity,
            salesCount: item.quantity
          }
        }
      )
    }
    
    // Clear user's cart
    const cart = await Cart.findOne({ user: req.user._id })
    if (cart) {
      await cart.clearCart()
    }
    
    // Populate order details
    await order.populate('items.product user')
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    })

  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    })
  }
})

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', verifyToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    
    const query = { user: req.user._id }
    if (status) query.status = status
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
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
    console.error('Get orders error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    })
  }
})

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', verifyToken, validateObjectId('id'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images modelUrl')
      .populate('user', 'displayName email')
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }
    
    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    res.status(200).json({
      success: true,
      order
    })

  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    })
  }
})

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', verifyToken, validateObjectId('id'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }
    
    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled'
      })
    }
    
    // Update order status
    await order.updateStatus('cancelled', 'Cancelled by customer', req.user._id)
    
    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { 
          $inc: { 
            stock: item.quantity,
            salesCount: -item.quantity
          }
        }
      )
    }
    
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    })

  } catch (error) {
    console.error('Cancel order error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    })
  }
})

// @route   GET /api/orders/:id/track
// @desc    Get order tracking information
// @access  Private
router.get('/:id/track', verifyToken, validateObjectId('id'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('orderNumber status shipping statusHistory createdAt')
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }
    
    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    res.status(200).json({
      success: true,
      tracking: {
        orderNumber: order.orderNumber,
        status: order.status,
        carrier: (order.shippingInfo || order.shipping)?.carrier,
        trackingNumber: (order.shippingInfo || order.shipping)?.trackingNumber,
        estimatedDelivery: (order.shippingInfo || order.shipping)?.estimatedDelivery,
        shippedAt: (order.shippingInfo || order.shipping)?.shippedAt,
        deliveredAt: (order.shippingInfo || order.shipping)?.deliveredAt,
        statusHistory: order.statusHistory
      }
    })

  } catch (error) {
    console.error('Track order error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get tracking information'
    })
  }
})

// @route   GET /api/orders/:id/invoice
// @desc    Generate and download invoice for order
// @access  Private
router.get('/:id/invoice', verifyToken, validateObjectId('id'), async (req, res) => {
  try {
    console.log('=== INVOICE REQUEST START ===')
    console.log('Order ID:', req.params.id)
    console.log('User ID:', req.user._id)
    console.log('User Role:', req.user.role)
    
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images sku')
      .populate('user', 'displayName email phoneNumber customerId')
    
    if (!order) {
      console.log('ERROR: Order not found:', req.params.id)
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }
    
    console.log('Order found:')
    console.log('- Order Number:', order.orderNumber)
    console.log('- Status:', order.status)
    console.log('- Owner ID:', order.user._id.toString())
    console.log('- Items count:', order.items.length)
    
    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      console.log('ERROR: Access denied')
      console.log('- Requester:', req.user._id.toString())
      console.log('- Owner:', order.user._id.toString())
      console.log('- Is Admin:', req.user.role === 'admin')
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    // Allow invoice download for confirmed, processing, shipped, and delivered orders
    const allowedStatuses = ['confirmed', 'processing', 'shipped', 'delivered']
    if (!allowedStatuses.includes(order.status)) {
      console.log('ERROR: Invoice not available for status:', order.status)
      console.log('- Allowed statuses:', allowedStatuses)
      return res.status(400).json({
        success: false,
        message: `Invoice is not available for orders with status: ${order.status}. Invoice is available for confirmed, processing, shipped, and delivered orders.`
      })
    }
    
    console.log('Generating invoice content...')
    
    // Safely generate invoice content
    const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    console.log('Invoice date:', invoiceDate)
    
    // Build invoice content step by step to avoid template literal issues
    let invoiceContent = 'INVOICE\n'
    invoiceContent += '=======\n\n'
    invoiceContent += `Invoice Number: INV-${order.orderNumber}\n`
    invoiceContent += `Order Number: ${order.orderNumber}\n`
    invoiceContent += `Invoice Date: ${invoiceDate}\n`
    invoiceContent += `Order Status: ${order.status.toUpperCase()}\n\n`
    
    console.log('Adding customer info...')
    invoiceContent += 'BILL TO:\n'
    invoiceContent += '--------\n'
    invoiceContent += `${order.user.displayName || 'N/A'}\n`
    invoiceContent += `${order.user.email || 'N/A'}\n`
    invoiceContent += `${order.user.phoneNumber ? `Phone: ${order.user.phoneNumber}` : 'Phone: N/A'}\n`
    invoiceContent += `Customer ID: ${order.user.customerId || 'N/A'}\n\n`
    
    console.log('Adding shipping address...')
    invoiceContent += 'SHIP TO:\n'
    invoiceContent += '--------\n'
    invoiceContent += `${order.shippingAddress?.street || 'N/A'}\n`
    invoiceContent += `${order.shippingAddress?.city || 'N/A'}, ${order.shippingAddress?.state || 'N/A'} ${order.shippingAddress?.zipCode || 'N/A'}\n`
    invoiceContent += `${order.shippingAddress?.country || 'N/A'}\n\n`
    
    console.log('Adding items...')
    invoiceContent += 'ITEMS ORDERED:\n'
    invoiceContent += '--------------\n'
    order.items.forEach((item, index) => {
      console.log(`Processing item ${index + 1}:`, item.name)
      invoiceContent += `${index + 1}. ${item.name || 'Product'}\n`
      invoiceContent += `   SKU: ${item.sku || 'N/A'}\n`
      invoiceContent += `   Quantity: ${item.quantity}\n`
      invoiceContent += `   Unit Price: $${item.price.toFixed(2)}\n`
      invoiceContent += `   Total: $${(item.price * item.quantity).toFixed(2)}\n\n`
    })
    
    console.log('Adding order summary...')
    invoiceContent += 'ORDER SUMMARY:\n'
    invoiceContent += '--------------\n'
    invoiceContent += `Subtotal: $${order.subtotal.toFixed(2)}\n`
    invoiceContent += `Tax: $${order.tax.toFixed(2)}\n`
    
    // Handle both old and new shipping structure
    let shippingCost = 0
    if (typeof order.shipping === 'number') {
      shippingCost = order.shipping
    } else if (order.shippingCost !== undefined) {
      shippingCost = order.shippingCost
    }
    
    invoiceContent += `Shipping: ${shippingCost === 0 ? 'FREE' : '$' + shippingCost.toFixed(2)}\n`
    if (order.discount > 0) {
      invoiceContent += `Discount: -$${order.discount.toFixed(2)}\n`
    }
    invoiceContent += `Total Amount: $${order.total.toFixed(2)}\n\n`
    
    console.log('Adding payment info...')
    invoiceContent += 'PAYMENT INFORMATION:\n'
    invoiceContent += '--------------------\n'
    invoiceContent += `Payment Method: ${order.payment.method.replace('_', ' ').toUpperCase()}\n`
    invoiceContent += `Payment Status: ${order.payment.status.toUpperCase()}\n`
    if (order.payment.paidAt) {
      const paymentDate = new Date(order.payment.paidAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      invoiceContent += `Payment Date: ${paymentDate}\n`
    }
    invoiceContent += '\n'
    
    // Handle both old and new shipping info structure
    const shippingInfo = order.shippingInfo || order.shipping
    if (shippingInfo?.trackingNumber) {
      console.log('Adding shipping info...')
      invoiceContent += 'SHIPPING INFORMATION:\n'
      invoiceContent += '---------------------\n'
      invoiceContent += `Carrier: ${shippingInfo.carrier || 'N/A'}\n`
      invoiceContent += `Tracking Number: ${shippingInfo.trackingNumber}\n`
      if (shippingInfo.estimatedDelivery) {
        invoiceContent += `Estimated Delivery: ${new Date(shippingInfo.estimatedDelivery).toLocaleDateString()}\n`
      }
      if (shippingInfo.shippedAt) {
        invoiceContent += `Shipped Date: ${new Date(shippingInfo.shippedAt).toLocaleDateString()}\n`
      }
      if (shippingInfo.deliveredAt) {
        invoiceContent += `Delivered Date: ${new Date(shippingInfo.deliveredAt).toLocaleDateString()}\n`
      }
      invoiceContent += '\n'
    }
    
    invoiceContent += 'Thank you for your business!\n\n'
    invoiceContent += 'For questions about this invoice, please contact our customer service.\n'
    invoiceContent += `Generated on: ${new Date().toLocaleString('en-US')}`
    
    console.log('Invoice content generated, length:', invoiceContent.length)
    
    // Set headers for file download
    const filename = `invoice-${order.orderNumber || order._id}.txt`
    console.log('Setting headers for file:', filename)
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', Buffer.byteLength(invoiceContent, 'utf8'))
    res.setHeader('Cache-Control', 'no-cache')
    
    console.log('Sending invoice response...')
    console.log('=== INVOICE REQUEST SUCCESS ===')
    res.send(invoiceContent)

  } catch (error) {
    console.log('=== INVOICE REQUEST ERROR ===')
    console.error('Generate invoice error:', error)
    console.error('Error stack:', error.stack)
    console.log('=== END ERROR ===')
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : 'Internal server error'
    })
  }
})

// @route   GET /api/orders/:id/test
// @desc    Test order retrieval for debugging
// @access  Private
router.get('/:id/test', verifyToken, validateObjectId('id'), async (req, res) => {
  try {
    console.log('Test request for order:', req.params.id, 'by user:', req.user._id)
    
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images sku')
      .populate('user', 'displayName email phoneNumber customerId')
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }
    
    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'Order test successful',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        itemCount: order.items.length,
        user: {
          id: order.user._id,
          name: order.user.displayName,
          email: order.user.email
        }
      }
    })

  } catch (error) {
    console.error('Test order error:', error)
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    })
  }
})

module.exports = router