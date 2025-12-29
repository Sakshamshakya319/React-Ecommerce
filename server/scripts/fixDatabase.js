const mongoose = require('mongoose')
require('dotenv').config()

const fixDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    
    console.log('Connected to MongoDB')
    
    // Get the products collection
    const db = mongoose.connection.db
    const collection = db.collection('products')
    
    // Drop all indexes except _id
    try {
      const indexes = await collection.indexes()
      console.log('Current indexes:', indexes.map(idx => idx.name))
      
      // Drop the problematic variants.sku index
      await collection.dropIndex('variants.sku_1')
      console.log('Dropped variants.sku_1 index')
    } catch (error) {
      console.log('Index may not exist:', error.message)
    }
    
    // Clear all products to start fresh
    await collection.deleteMany({})
    console.log('Cleared all products')
    
    console.log('✅ Database fixed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error fixing database:', error)
    process.exit(1)
  }
}

fixDatabase()