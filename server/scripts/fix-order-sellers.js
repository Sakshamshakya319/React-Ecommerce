const mongoose = require('mongoose')
const Order = require('../models/Order')
const Product = require('../models/Product')
require('dotenv').config()

async function fixOrderSellers() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce')
    
    console.log('Finding orders without seller information...')
    
    // Find orders where items don't have seller field
    const ordersToFix = await Order.find({
      $or: [
        { 'items.seller': { $exists: false } },
        { 'items.seller': null }
      ]
    })
    
    console.log(`Found ${ordersToFix.length} orders to fix`)
    
    for (const order of ordersToFix) {
      console.log(`Fixing order ${order.orderNumber || order._id}...`)
      
      let updated = false
      
      for (const item of order.items) {
        if (!item.seller) {
          // Fetch product to get seller
          const product = await Product.findById(item.product)
          if (product && product.seller) {
            item.seller = product.seller
            updated = true
            console.log(`  - Updated item ${item.name} with seller ${product.seller}`)
          }
        }
      }
      
      if (updated) {
        await order.save()
        console.log(`  ✅ Order ${order.orderNumber || order._id} updated`)
      }
    }
    
    console.log('✅ Migration completed successfully!')
    
    // Verify the fix
    const remainingOrders = await Order.find({
      $or: [
        { 'items.seller': { $exists: false } },
        { 'items.seller': null }
      ]
    })
    
    console.log(`Remaining orders without seller: ${remainingOrders.length}`)
    
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// Run the migration
if (require.main === module) {
  fixOrderSellers()
}

module.exports = fixOrderSellers