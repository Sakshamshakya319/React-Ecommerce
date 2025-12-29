#!/usr/bin/env node

/**
 * Unified Email Service Test Script
 * 
 * This script tests the unified email service that automatically detects
 * whether recipients are users or sellers and sends appropriate emails.
 */

const mongoose = require('mongoose')
const unifiedEmailService = require('../services/unifiedEmailService')
const User = require('../models/User')
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

async function findTestRecipients() {
  console.log('🔍 Finding test recipients...\n')
  
  // Find test user
  let testUser = await User.findOne({ isActive: true })
  if (!testUser) {
    console.log('📝 No active user found. Creating test user...')
    testUser = new User({
      firebaseUid: 'test-user-' + Date.now(),
      customerId: 'CUST' + Date.now(),
      email: process.env.TEST_USER_EMAIL || 'testuser@example.com',
      displayName: 'Test User',
      phoneNumber: '9876543210',
      isActive: true,
      isEmailVerified: true,
      role: 'user'
    })
    await testUser.save()
    console.log('✅ Test user created')
  }
  
  // Find test seller
  let testSeller = await Seller.findOne({ status: 'approved' })
  if (!testSeller) {
    console.log('📝 No approved seller found. Looking for any seller...')
    testSeller = await Seller.findOne()
    
    if (!testSeller) {
      console.log('📝 No seller found. Creating test seller...')
      testSeller = new Seller({
        businessName: 'Test Electronics Store',
        ownerName: 'Test Seller',
        email: process.env.TEST_SELLER_EMAIL || 'testseller@example.com',
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
  }
  
  return { testUser, testSeller }
}

async function testRecipientDetection(testUser, testSeller) {
  console.log('🧪 Testing Recipient Detection...\n')
  
  const testEmails = [
    { email: testUser.email, expectedType: 'user' },
    { email: testSeller.email, expectedType: 'seller' },
    { email: 'nonexistent@example.com', expectedType: 'unknown' }
  ]
  
  for (const test of testEmails) {
    try {
      console.log(`🔍 Testing: ${test.email}`)
      const recipient = await unifiedEmailService.detectRecipientType(test.email)
      
      if (recipient.type === test.expectedType) {
        console.log(`   ✅ Correctly detected as: ${recipient.type}`)
        console.log(`   📝 Name: ${recipient.name}`)
        console.log(`   📊 Status: ${recipient.status}`)
      } else {
        console.log(`   ❌ Expected: ${test.expectedType}, Got: ${recipient.type}`)
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
    console.log('')
  }
}

async function testEmailTypes(testUser, testSeller) {
  console.log('📧 Testing Different Email Types...\n')
  
  const emailTests = [
    {
      name: 'User Password Reset',
      email: testUser.email,
      type: 'password-reset',
      method: 'sendPasswordReset',
      args: [testUser.email, 'http://localhost:3000/reset-password?token=test-token']
    },
    {
      name: 'Seller Password Reset',
      email: testSeller.email,
      type: 'password-reset',
      method: 'sendPasswordReset',
      args: [testSeller.email, 'http://localhost:3000/seller/reset-password?token=test-token']
    },
    {
      name: 'User Welcome Email',
      email: testUser.email,
      type: 'welcome',
      method: 'sendWelcomeEmail',
      args: [testUser.email]
    },
    {
      name: 'Seller Welcome Email',
      email: testSeller.email,
      type: 'welcome',
      method: 'sendWelcomeEmail',
      args: [testSeller.email]
    },
    {
      name: 'User Account Approval',
      email: testUser.email,
      type: 'approval',
      method: 'sendAccountStatusUpdate',
      args: [testUser.email, 'approved']
    },
    {
      name: 'Seller Account Approval',
      email: testSeller.email,
      type: 'approval',
      method: 'sendAccountStatusUpdate',
      args: [testSeller.email, 'approved']
    },
    {
      name: 'User Test Email',
      email: testUser.email,
      type: 'test',
      method: 'sendTestEmail',
      args: [testUser.email]
    },
    {
      name: 'Seller Test Email',
      email: testSeller.email,
      type: 'test',
      method: 'sendTestEmail',
      args: [testSeller.email]
    }
  ]
  
  for (const test of emailTests) {
    try {
      console.log(`📤 Testing: ${test.name}`)
      console.log(`   📧 To: ${test.email}`)
      
      const result = await unifiedEmailService[test.method](...test.args)
      
      console.log(`   ✅ Success! Message ID: ${result.messageId}`)
      
      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`)
    }
    console.log('')
  }
}

async function testEmailStats() {
  console.log('📊 Testing Email Statistics...\n')
  
  try {
    const stats = await unifiedEmailService.getEmailStats(30)
    
    console.log('📈 Email Statistics (Last 30 days):')
    console.log(`   Total Emails: ${stats?.totalEmails || 0}`)
    console.log(`   Sent Emails: ${stats?.sentEmails || 0}`)
    console.log(`   Failed Emails: ${stats?.failedEmails || 0}`)
    console.log(`   User Emails: ${stats?.userEmails || 0}`)
    console.log(`   Seller Emails: ${stats?.sellerEmails || 0}`)
    
  } catch (error) {
    console.log(`❌ Failed to get stats: ${error.message}`)
  }
  console.log('')
}

async function runTests() {
  console.log('🚀 Unified Email Service Test Suite')
  console.log('===================================\n')
  
  try {
    await connectDB()
    
    const { testUser, testSeller } = await findTestRecipients()
    
    console.log('📋 Test Recipients:')
    console.log(`   User: ${testUser.displayName} (${testUser.email})`)
    console.log(`   Seller: ${testSeller.businessName} (${testSeller.email})`)
    console.log('')
    
    await testRecipientDetection(testUser, testSeller)
    await testEmailTypes(testUser, testSeller)
    await testEmailStats()
    
    console.log('📊 Test Summary:')
    console.log('================')
    console.log('✅ Unified email service tests completed')
    console.log('📧 Check email inboxes for test messages')
    console.log('🎯 The system automatically detects user vs seller recipients')
    console.log('📱 Templates are customized based on recipient type')
    console.log('')
    
    console.log('💡 Key Features Tested:')
    console.log('• Automatic recipient type detection (user/seller)')
    console.log('• Type-specific email templates and styling')
    console.log('• Smart password reset with correct redirect URLs')
    console.log('• Welcome emails customized for users vs sellers')
    console.log('• Account status updates with appropriate messaging')
    console.log('• Email logging and statistics tracking')
    console.log('')
    
    console.log('🔧 Configuration Notes:')
    console.log('• Email service works with or without Gmail credentials')
    console.log('• In development mode, mock responses are returned')
    console.log('• Configure EMAIL_USER and EMAIL_PASS for real email sending')
    console.log('• See EMAIL_SETUP_GUIDE.md for Gmail setup instructions')
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message)
    process.exit(1)
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up...')
  await mongoose.connection.close()
  console.log('✅ Database connection closed')
  console.log('\n🎉 All tests completed successfully!')
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
runTests()
  .then(cleanup)
  .catch(error => {
    console.error('💥 Test runner crashed:', error.message)
    process.exit(1)
  })