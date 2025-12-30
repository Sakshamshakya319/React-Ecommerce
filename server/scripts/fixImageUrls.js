const mongoose = require('mongoose')
const Product = require('../models/Product')
require('dotenv').config()

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('Database connection error:', error.message)
    process.exit(1)
  }
}

// Fix image URLs in products
const fixProductImageUrls = async () => {
  try {
    console.log('Starting image URL fix...')
    
    // Find all products with images
    const products = await Product.find({
      'images.0': { $exists: true }
    })
    
    console.log(`Found ${products.length} products with images`)
    
    let updatedCount = 0
    
    for (const product of products) {
      let hasChanges = false
      
      // Fix each image URL
      const updatedImages = product.images.map(image => {
        let url = image.url
        
        // If URL contains full domain, convert to relative path
        if (url.includes('://')) {
          // Extract the path after the domain
          const urlParts = url.split('/')
          const uploadsIndex = urlParts.findIndex(part => part === 'uploads')
          
          if (uploadsIndex !== -1) {
            // Reconstruct relative path from /uploads onwards
            url = '/' + urlParts.slice(uploadsIndex).join('/')
            hasChanges = true
            console.log(`Fixed URL: ${image.url} -> ${url}`)
          }
        }
        // If URL doesn't start with /uploads, add the prefix
        else if (!url.startsWith('/uploads/') && !url.startsWith('http')) {
          url = `/uploads/products/${url}`
          hasChanges = true
          console.log(`Added prefix: ${image.url} -> ${url}`)
        }
        
        return {
          ...image,
          url: url
        }
      })
      
      // Update product if changes were made
      if (hasChanges) {
        await Product.findByIdAndUpdate(product._id, {
          images: updatedImages
        })
        updatedCount++
        console.log(`Updated product: ${product.name}`)
      }
    }
    
    console.log(`\nImage URL fix completed!`)
    console.log(`Total products processed: ${products.length}`)
    console.log(`Products updated: ${updatedCount}`)
    
  } catch (error) {
    console.error('Error fixing image URLs:', error)
  }
}

// Main execution
const main = async () => {
  await connectDB()
  await fixProductImageUrls()
  
  console.log('\nClosing database connection...')
  await mongoose.connection.close()
  console.log('Done!')
  process.exit(0)
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })
}

module.exports = { fixProductImageUrls }