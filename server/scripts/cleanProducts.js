const mongoose = require('mongoose')
const Product = require('../models/Product')
require('dotenv').config()

const cleanProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')
    
    // Get current products
    const products = await Product.find({})
    console.log(`Found ${products.length} existing products:`)
    products.forEach(p => console.log(`- ${p.name} (ID: ${p._id})`))
    
    // Remove all existing products
    const result = await Product.deleteMany({})
    console.log(`Deleted ${result.deletedCount} products`)
    
    console.log('Product cleanup completed successfully!')
    
  } catch (error) {
    console.error('Error cleaning products:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

cleanProducts()