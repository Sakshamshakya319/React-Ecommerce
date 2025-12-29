const mongoose = require('mongoose')
require('dotenv').config()

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const Product = require('../models/Product')

const clearProducts = async () => {
  try {
    console.log('Clearing all products...')
    
    const result = await Product.deleteMany({})
    
    console.log(`Deleted ${result.deletedCount} products`)
    console.log('Products cleared successfully!')
    
    process.exit(0)
  } catch (error) {
    console.error('Error clearing products:', error)
    process.exit(1)
  }
}

clearProducts()