const mongoose = require('mongoose')
const { sendSellerApprovalEmail } = require('../utils/emailService')
const Seller = require('../models/Seller')
require('dotenv').config()

const testSellerEmail = async () => {
  try {
    console.log('🧪 Testing Seller Email System...\n')
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')
    
    // Find an existing seller or create test data
    let testSeller = await Seller.findOne({ status: 'approved' })
    
    if (!testSeller) {
      console.log('📝 No approved seller found. Looking for any seller...')
      testSeller = await Seller.findOne()
    }
    
    if (!testSeller) {
      console.log('📝 No seller found. Creating test seller...')
      
      // Create a test seller
      testSeller = new Seller({
        businessName: 'Test Business Ltd',
        businessType: 'company',
        gstNumber: 'TEST123456789012',
        panNumber: 'TEST12345A',
        ownerName: 'Test Owner',
        email: 'test.seller@example.com', // Change this to your email for testing
        phone: '9876543210',
        businessAddress: {
          street: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India'
        },
        businessDescription: 'Test business for email testing',
        categories: ['Electronics'],
        status: 'pending'
      })
      
      await testSeller.save()
      console.log('✅ Test seller created')
    }
    
    console.log(`\n📧 Testing email for seller: ${testSeller.ownerName}`)
    console.log(`📧 Email: ${testSeller.email}`)
    console.log(`🏢 Business: ${testSeller.businessName}`)
    
    // Generate a test password
    const testPassword = 'test123456'
    
    console.log(`🔑 Test password: ${testPassword}`)
    
    // Test the email function
    console.log('\n📤 Sending test email...')
    
    const emailSent = await sendSellerApprovalEmail(
      testSeller.email,
      testSeller.ownerName,
      testSeller.businessName,
      testPassword
    )
    
    if (emailSent) {
      console.log('✅ Email sent successfully!')
      console.log('\n📋 Email Details:')
      console.log(`   To: ${testSeller.email}`)
      console.log(`   Subject: 🎉 Your Seller Account has been Approved!`)
      console.log(`   Password: ${testPassword}`)
      console.log(`   Login URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}/seller/login`)
    } else {
      console.log('❌ Email sending failed')
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📧 EMAIL CONFIGURATION CHECK:')
    console.log('='.repeat(60))
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`)
    console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set'}`)
    console.log(`CLIENT_URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`)
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('\n⚠️  EMAIL SETUP INSTRUCTIONS:')
      console.log('1. Go to your Google Account settings')
      console.log('2. Enable 2-Factor Authentication')
      console.log('3. Generate an App Password for Mail')
      console.log('4. Update your .env file:')
      console.log('   EMAIL_USER=your-email@gmail.com')
      console.log('   EMAIL_PASS=your-16-digit-app-password')
    }
    
    console.log('\n🔍 Check your email inbox and console logs above.')
    console.log('📝 Please confirm if you received the email!')
    
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Error testing seller email:', error)
    process.exit(1)
  }
}

// Run the test
testSellerEmail()