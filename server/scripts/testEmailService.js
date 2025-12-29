#!/usr/bin/env node

/**
 * Email Service Test Script
 * 
 * This script tests the new email service functionality for sellers.
 * Run this script to verify that email sending is working properly.
 */

const mongoose = require('mongoose')
const emailService = require('../services/emailService')
const Seller = require('../models/Seller')
require('dotenv').config()

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

async function testEmailService() {
  console.log('🚀 Email Service Test Suite')
  console.log('===========================\n')

  try {
    // Find a test seller
    let testSeller = await Seller.findOne({ status: 'approved' })
    
    if (!testSeller) {
      console.log('📝 No approved seller found. Looking for any seller...')
      testSeller = await Seller.findOne()
    }
    
    if (!testSeller) {
      console.log('❌ No sellers found in database. Creating test seller...')
      
      testSeller = new Seller({
        businessName: 'Test Electronics Store',
        ownerName: 'Test Owner',
        email: process.env.TEST_EMAIL || 'test@example.com',
        phone: '9876543210',
        gstNumber: 'TEST123456789',
        panNumber: 'TESTPAN123',
        businessAddress: {
          street: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India'
        },
        status: 'approved'
      })
      
      await testSeller.save()
      console.log('✅ Test seller created')
    }
    
    console.log('📋 Test Seller Details:')
    console.log(`   Business: ${testSeller.businessName}`)
    console.log(`   Email: ${testSeller.email}`)
    console.log(`   Status: ${testSeller.status}`)
    
    // Test different email types
    const emailTests = [
      {
        name: 'Basic Test Email',
        type: 'test',
        description: 'Tests basic email functionality'
      },
      {
        name: 'Password Reset Email',
        type: 'password-reset',
        description: 'Tests password reset email template'
      },
      {
        name: 'Welcome Email',
        type: 'welcome',
        description: 'Tests welcome email for new sellers'
      },
      {
        name: 'Account Approval Email',
        type: 'approval',
        description: 'Tests account approval notification'
      }
    ]
    
    console.log('\n📤 Running Email Tests...\n')
    
    for (const test of emailTests) {
      try {
        console.log(`🧪 Testing: ${test.name}`)
        console.log(`   Description: ${test.description}`)
        
        let result
        
        switch (test.type) {
          case 'test':
            result = await emailService.sendTestEmail(testSeller.email)
            break
            
          case 'password-reset':
            const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/seller/reset-password?token=test-token-${Date.now()}`
            result = await emailService.sendSellerPasswordReset(
              testSeller.email,
              testSeller.businessName,
              resetUrl
            )
            break
            
          case 'welcome':
            result = await emailService.sendSellerWelcomeEmail(
              testSeller.email,
              testSeller.businessName
            )
            break
            
          case 'approval':
            result = await emailService.sendSellerAccountApproval(
              testSeller.email,
              testSeller.businessName
            )
            break
        }
        
        console.log(`   ✅ Success! Message ID: ${result.messageId}`)
        console.log(`   📧 Sent to: ${testSeller.email}`)
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`)
        
        if (error.message.includes('Invalid login')) {
          console.log('   💡 Hint: Check EMAIL_USER and EMAIL_PASS in .env file')
          console.log('   💡 For Gmail: Use App Password, not regular password')
        }
      }
      
      console.log('') // Empty line for readability
    }
    
    console.log('📊 Test Summary:')
    console.log('================')
    console.log('✅ Email service tests completed')
    console.log('📧 Check your email inbox for test messages')
    console.log('\n💡 Tips:')
    console.log('• Check spam/junk folder if emails are not in inbox')
    console.log('• Verify EMAIL_USER and EMAIL_PASS in server/.env')
    console.log('• For Gmail, use App Password instead of regular password')
    console.log('• Generate App Password: Google Account > Security > 2-Step Verification > App passwords')
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message)
    process.exit(1)
  }
}

async function runTests() {
  await connectDB()
  await testEmailService()
  
  console.log('\n🎉 All tests completed!')
  process.exit(0)
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error.message)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error.message)
  process.exit(1)
})

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner crashed:', error.message)
  process.exit(1)
})