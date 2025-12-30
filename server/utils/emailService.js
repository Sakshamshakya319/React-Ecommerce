const nodemailer = require('nodemailer')
const EmailLog = require('../models/EmailLog')

// Create transporter with fallback options
const createTransporter = () => {
  // Check if email credentials are available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Using console logging as fallback.')
    return null
  }

  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    })
  } catch (error) {
    console.error('Failed to create email transporter:', error)
    return null
  }
}

// Log email function
const logEmail = async (emailData) => {
  try {
    const emailLog = new EmailLog(emailData)
    await emailLog.save()
    return emailLog
  } catch (error) {
    console.error('Error logging email:', error)
    return null
  }
}

// Send email with logging
const sendEmailWithLogging = async (emailOptions, emailType, relatedEntity = null) => {
  const emailLog = await logEmail({
    to: emailOptions.to,
    from: emailOptions.from || process.env.EMAIL_USER,
    subject: emailOptions.subject,
    body: emailOptions.html || emailOptions.text,
    emailType,
    relatedEntity,
    provider: 'nodemailer'
  })

  try {
    const transporter = createTransporter()
    
    if (!transporter) {
      // Fallback logging
      logEmailFallback(emailOptions.to, emailOptions.subject, 'Email content', emailOptions.password)
      
      if (emailLog) {
        await emailLog.markAsFailed('Email service not configured - using console fallback')
      }
      
      return { success: true, fallback: true, emailLogId: emailLog?._id }
    }

    // Verify transporter connection
    await transporter.verify()
    
    const result = await transporter.sendMail(emailOptions)
    
    if (emailLog) {
      await emailLog.markAsSent(result.messageId)
    }
    
    console.log(`✅ Email sent successfully to ${emailOptions.to}`)
    return { success: true, messageId: result.messageId, emailLogId: emailLog?._id }
    
  } catch (error) {
    console.error(`❌ Email sending failed to ${emailOptions.to}:`, error.message)
    
    if (emailLog) {
      await emailLog.markAsFailed(error.message, error.code)
    }
    
    // Fallback: log to console for development
    logEmailFallback(emailOptions.to, emailOptions.subject, 'Email content', emailOptions.password)
    
    return { success: false, error: error.message, emailLogId: emailLog?._id }
  }
}

// Fallback function to log email content when email service is not available
const logEmailFallback = (to, subject, content, password = null) => {
  console.log('\n' + '='.repeat(80))
  console.log('📧 EMAIL FALLBACK - Email service not configured')
  console.log('='.repeat(80))
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  if (password) {
    console.log(`🔑 SELLER LOGIN CREDENTIALS:`)
    console.log(`   Email: ${to}`)
    console.log(`   Password: ${password}`)
    console.log(`   Login URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}/seller/login`)
  }
  console.log('='.repeat(80) + '\n')
}

// Send seller approval email
const sendSellerApprovalEmail = async (sellerEmail, sellerName, businessName, defaultPassword) => {
  const emailOptions = {
    from: process.env.EMAIL_USER,
    to: sellerEmail,
    subject: '🎉 Your Seller Account has been Approved!',
    password: defaultPassword, // For fallback logging
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Shoporia</h1>
            <p style="color: #6b7280; margin: 5px 0;">Seller Portal</p>
          </div>
          
          <h2 style="color: #059669; text-align: center; margin-bottom: 20px;">
            🎉 Congratulations! Your seller account has been approved!
          </h2>
          
          <p style="color: #374151; line-height: 1.6;">
            Dear ${sellerName},
          </p>
          
          <p style="color: #374151; line-height: 1.6;">
            We're excited to inform you that your seller application for <strong>${businessName}</strong> has been approved! 
            You can now start selling your products on our e-commerce platform.
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Your Login Credentials:</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${sellerEmail}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 16px; font-weight: bold;">${defaultPassword}</code></p>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>Important:</strong> Please change your password after your first login for security purposes.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/seller/login" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Login to Seller Dashboard
            </a>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">
            Welcome to our family! We're excited to see your products in our marketplace.
          </p>
          
          <p style="color: #374151; line-height: 1.6;">
            Best regards,<br>
            <strong>The Store Team</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            This email was sent to ${sellerEmail}. If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `
  }

  return await sendEmailWithLogging(
    emailOptions, 
    'seller_approval',
    { entityType: 'seller', entityId: null }
  )
}

// Send seller rejection email
const sendSellerRejectionEmail = async (sellerEmail, sellerName, businessName, reason) => {
  const emailOptions = {
    from: process.env.EMAIL_USER,
    to: sellerEmail,
    subject: 'Update on Your Seller Application',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Shoporia</h1>
            <p style="color: #6b7280; margin: 5px 0;">Seller Portal</p>
          </div>
          
          <h2 style="color: #dc2626; text-align: center; margin-bottom: 20px;">
            Update on Your Seller Application
          </h2>
          
          <p style="color: #374151; line-height: 1.6;">
            Dear ${sellerName},
          </p>
          
          <p style="color: #374151; line-height: 1.6;">
            Thank you for your interest in becoming a seller on our e-commerce platform. 
            After careful review of your application for <strong>${businessName}</strong>, 
            we regret to inform you that we cannot approve your seller account at this time.
          </p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <h3 style="color: #991b1b; margin-top: 0;">Reason for Rejection:</h3>
            <p style="margin: 0; color: #7f1d1d;">${reason}</p>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">
            We encourage you to address the concerns mentioned above and reapply in the future. 
            Our platform maintains high standards to ensure the best experience for all our customers.
          </p>
          
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;">
              <strong>Questions?</strong> If you have any questions about this decision or need clarification, 
              please contact our seller support team.
            </p>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">
            Thank you for your understanding.
          </p>
          
          <p style="color: #374151; line-height: 1.6;">
            Best regards,<br>
            <strong>The Store Team</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            This email was sent to ${sellerEmail}. If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `
  }

  return await sendEmailWithLogging(
    emailOptions, 
    'seller_rejection',
    { entityType: 'seller', entityId: null }
  )
}

// Get email statistics
const getEmailStats = async (filters = {}) => {
  return await EmailLog.getEmailStats(filters)
}

// Get recent emails
const getRecentEmails = async (limit = 10, filters = {}) => {
  return await EmailLog.getRecentEmails(limit, filters)
}

module.exports = {
  sendSellerApprovalEmail,
  sendSellerRejectionEmail,
  getEmailStats,
  getRecentEmails,
  EmailLog
}