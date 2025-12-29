const mongoose = require('mongoose')
const Seller = require('../models/Seller')
require('dotenv').config()

const approvePendingSellers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')
    
    // Find all pending sellers
    const pendingSellers = await Seller.find({ status: 'pending' })
    
    if (pendingSellers.length === 0) {
      console.log('No pending sellers found')
      process.exit(0)
    }
    
    // Approve all pending sellers
    const result = await Seller.updateMany(
      { status: 'pending' },
      { 
        status: 'approved',
        approvedAt: new Date()
      }
    )
    
    console.log(`Approved ${result.modifiedCount} sellers`)
    
    // List approved sellers
    const approvedSellers = await Seller.find({ status: 'approved' }).select('businessName email status')
    console.log('\nApproved sellers:')
    approvedSellers.forEach(seller => {
      console.log(`- ${seller.businessName} (${seller.email})`)
    })
    
    process.exit(0)
    
  } catch (error) {
    console.error('Error approving sellers:', error)
    process.exit(1)
  }
}

approvePendingSellers()