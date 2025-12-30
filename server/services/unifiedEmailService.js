const nodemailer = require('nodemailer')
const User = require('../models/User')
const Seller = require('../models/Seller')
const EmailLog = require('../models/EmailLog')

class UnifiedEmailService {
  constructor() {
    this.transporter = null
    this.initializeTransporter()
  }

  async initializeTransporter() {
    try {
      // Check if email credentials are configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
          process.env.EMAIL_USER === 'your-email@gmail.com' || 
          process.env.EMAIL_PASS === 'your-app-password') {
        console.log('⚠️  Email service not configured - using placeholder credentials')
        console.log('💡 To enable email service:')
        console.log('   1. Update EMAIL_USER and EMAIL_PASS in server/.env')
        console.log('   2. For Gmail: Use App Password, not regular password')
        console.log('   3. See EMAIL_SETUP_GUIDE.md for detailed instructions')
        return
      }

      // Create transporter with Gmail configuration
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        },
        // Add timeouts to prevent hanging
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000
      })

      // Verify connection configuration non-blocking
      this.verifyConnection()
      
    } catch (error) {
      console.error('❌ Unified Email service configuration error:', error.message)
    }
  }

  async verifyConnection() {
    if (!this.transporter) return

    try {
      await this.transporter.verify()
      console.log('✅ Unified Email service initialized successfully')
      console.log(`📧 Configured for: ${process.env.EMAIL_USER}`)
    } catch (error) {
      console.warn('⚠️  Unified Email service connection warning:', error.message)
      console.warn('   (Service will attempt to reconnect when sending emails)')
      
      if (error.message.includes('Invalid login')) {
        console.error('💡 Hint: Check EMAIL_USER and EMAIL_PASS in .env file')
      }
    }
  }

  // Detect if email belongs to user or seller
  async detectRecipientType(email) {
    try {
      // Check if it's a seller first
      const seller = await Seller.findOne({ email })
      if (seller) {
        return {
          type: 'seller',
          data: seller,
          name: seller.businessName || seller.ownerName,
          status: seller.status
        }
      }

      // Check if it's a user
      const user = await User.findOne({ email })
      if (user) {
        return {
          type: 'user',
          data: user,
          name: user.displayName || user.profile?.firstName || 'User',
          status: user.isActive ? 'active' : 'inactive'
        }
      }

      return {
        type: 'unknown',
        data: null,
        name: 'User',
        status: 'unknown'
      }
    } catch (error) {
      console.error('Error detecting recipient type:', error)
      return {
        type: 'unknown',
        data: null,
        name: 'User',
        status: 'unknown'
      }
    }
  }

  // Send email with automatic recipient detection
  async sendEmail(options) {
    if (!this.transporter) {
      console.log('⚠️  Email service not configured - email not sent')
      console.log('💡 Configure EMAIL_USER and EMAIL_PASS in server/.env to enable email sending')
      
      // In development, return a mock success response
      if (process.env.NODE_ENV === 'development') {
        return {
          messageId: 'mock-message-id-' + Date.now(),
          response: 'Email service not configured - mock response'
        }
      }
      
      throw new Error('Email service not configured')
    }

    try {
      const mailOptions = {
        from: {
          name: '3D E-commerce Platform',
          address: process.env.EMAIL_USER
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('✅ Email sent successfully:', result.messageId)
      
      // Log email to database
      await this.logEmail({
        to: options.to,
        subject: options.subject,
        type: options.emailType || 'general',
        status: 'sent',
        messageId: result.messageId,
        recipientType: options.recipientType
      })
      
      return result
      
    } catch (error) {
      console.error('❌ Failed to send email:', error.message)
      
      // Log failed email
      await this.logEmail({
        to: options.to,
        subject: options.subject,
        type: options.emailType || 'general',
        status: 'failed',
        error: error.message,
        recipientType: options.recipientType
      })
      
      throw error
    }
  }

  // Log email to database
  async logEmail(logData) {
    try {
      const emailLog = new EmailLog({
        recipient: logData.to,
        subject: logData.subject,
        type: logData.type,
        status: logData.status,
        messageId: logData.messageId,
        error: logData.error,
        recipientType: logData.recipientType,
        sentAt: new Date()
      })
      
      await emailLog.save()
    } catch (error) {
      console.error('Failed to log email:', error.message)
    }
  }

  // Generate unified email template
  generateEmailTemplate(templateData) {
    const { 
      title, 
      recipientName, 
      recipientType,
      message, 
      buttonText, 
      buttonUrl, 
      additionalInfo,
      footerText,
      isUrgent = false
    } = templateData

    const typeColors = {
      user: '#10b981', // Green
      seller: '#6366f1', // Indigo
      admin: '#f59e0b'  // Amber
    }

    const typeIcons = {
      user: '👤',
      seller: '🏪',
      admin: '⚙️'
    }

    const primaryColor = typeColors[recipientType] || '#6366f1'
    const typeIcon = typeIcons[recipientType] || '📧'

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .email-container {
                background-color: #ffffff;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                border-top: 4px solid ${primaryColor};
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid ${primaryColor};
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: ${primaryColor};
                margin-bottom: 10px;
            }
            .recipient-badge {
                display: inline-block;
                background-color: ${primaryColor};
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 15px;
            }
            .title {
                font-size: 24px;
                color: #1f2937;
                margin-bottom: 20px;
                ${isUrgent ? 'color: #dc2626;' : ''}
            }
            .urgent-banner {
                background-color: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 20px;
                text-align: center;
                color: #dc2626;
                font-weight: bold;
            }
            .greeting {
                font-size: 18px;
                color: #4b5563;
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                color: #6b7280;
                margin-bottom: 30px;
                line-height: 1.8;
            }
            .button-container {
                text-align: center;
                margin: 40px 0;
            }
            .action-button {
                display: inline-block;
                background-color: ${primaryColor};
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            .action-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            }
            .additional-info {
                background-color: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin: 30px 0;
                border-left: 4px solid ${primaryColor};
            }
            .security-note {
                background-color: #fef3c7;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #f59e0b;
            }
            .contact-info {
                background-color: #f0f9ff;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #0ea5e9;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #9ca3af;
                font-size: 14px;
            }
            .support-links {
                margin-top: 20px;
                text-align: center;
            }
            .support-links a {
                color: ${primaryColor};
                text-decoration: none;
                margin: 0 10px;
                font-size: 14px;
            }
            @media (max-width: 600px) {
                body {
                    padding: 10px;
                }
                .email-container {
                    padding: 20px;
                }
                .title {
                    font-size: 20px;
                }
                .action-button {
                    padding: 12px 24px;
                    font-size: 14px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">${typeIcon} 3D E-commerce</div>
                <div class="recipient-badge">${recipientType.toUpperCase()}</div>
                <div class="title">${title}</div>
            </div>
            
            ${isUrgent ? '<div class="urgent-banner">🚨 URGENT: Immediate Action Required</div>' : ''}
            
            <div class="greeting">
                Hello ${recipientName},
            </div>
            
            <div class="message">
                ${message}
            </div>
            
            ${buttonUrl ? `
            <div class="button-container">
                <a href="${buttonUrl}" class="action-button">${buttonText || 'Take Action'}</a>
            </div>
            ` : ''}
            
            ${additionalInfo ? `
            <div class="additional-info">
                <strong>📋 Important Information:</strong><br>
                ${additionalInfo}
            </div>
            ` : ''}
            
            <div class="security-note">
                <strong>🔒 Security Note:</strong> This email was sent to you because you have an account with us. 
                If you didn't expect this email, please contact our support team immediately.
            </div>
            
            <div class="contact-info">
                <strong>💬 Need Help?</strong><br>
                Our support team is here to help you 24/7.<br>
                ${buttonUrl ? `If you're having trouble with the button above, copy and paste this URL: <br><a href="${buttonUrl}" style="color: ${primaryColor}; word-break: break-all;">${buttonUrl}</a>` : ''}
            </div>
            
            <div class="footer">
                ${footerText || 'This email was sent from 3D E-commerce Platform. Please do not reply to this email.'}<br>
                <br>
                © ${new Date().getFullYear()} 3D E-commerce Platform. All rights reserved.<br>
                
                <div class="support-links">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/support">Support Center</a>
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/privacy">Privacy Policy</a>
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/terms">Terms of Service</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `
  }

  // Generate plain text version
  generateTextTemplate(templateData) {
    const { title, recipientName, recipientType, message, buttonUrl, additionalInfo } = templateData

    return `
${title}
${'='.repeat(title.length)}

Hello ${recipientName},

${message}

${buttonUrl ? `Take action: ${buttonUrl}` : ''}

${additionalInfo ? `Important Information: ${additionalInfo}` : ''}

Security Note: This email was sent to you because you have a ${recipientType} account with us.
If you didn't expect this email, please contact our support team.

Need Help? Visit our support center: ${process.env.CLIENT_URL || 'http://localhost:3000'}/support

© ${new Date().getFullYear()} 3D E-commerce Platform. All rights reserved.
    `.trim()
  }

  // Smart password reset - detects user type automatically
  async sendPasswordReset(email, resetUrl) {
    const recipient = await this.detectRecipientType(email)
    
    if (recipient.type === 'unknown') {
      throw new Error('No account found with this email address')
    }

    const templateData = {
      title: `Reset Your ${recipient.type === 'seller' ? 'Seller' : 'User'} Account Password`,
      recipientName: recipient.name,
      recipientType: recipient.type,
      message: `
        We received a request to reset the password for your ${recipient.type} account. 
        If you made this request, click the button below to reset your password.
      `,
      buttonText: 'Reset My Password',
      buttonUrl: resetUrl,
      additionalInfo: `
        • This link is valid for 1 hour only<br>
        • You can only use this link once<br>
        • If the link expires, you can request a new one<br>
        • Make sure to choose a strong password with at least 6 characters
      `,
      footerText: 'If you did not request this password reset, please contact our support team immediately.'
    }

    const htmlContent = this.generateEmailTemplate(templateData)
    const textContent = this.generateTextTemplate(templateData)

    return await this.sendEmail({
      to: email,
      subject: `🔐 Reset Your ${recipient.type === 'seller' ? 'Seller' : 'User'} Account Password - 3D E-commerce`,
      html: htmlContent,
      text: textContent,
      emailType: 'password_reset',
      recipientType: recipient.type
    })
  }

  // Smart welcome email - detects user type automatically
  async sendWelcomeEmail(email) {
    const recipient = await this.detectRecipientType(email)
    
    if (recipient.type === 'unknown') {
      throw new Error('No account found with this email address')
    }

    const isUser = recipient.type === 'user'
    const isSeller = recipient.type === 'seller'

    const templateData = {
      title: `Welcome to 3D E-commerce Platform!`,
      recipientName: recipient.name,
      recipientType: recipient.type,
      message: `
        ${isUser ? 
          'Welcome to our amazing 3D e-commerce platform! We\'re excited to have you join our community of shoppers.' :
          'Congratulations! Your seller account has been successfully created. We\'re excited to have you join our platform and start selling your products.'
        }
      `,
      buttonText: isUser ? 'Start Shopping' : 'Access Seller Dashboard',
      buttonUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}${isUser ? '/products' : '/seller/login'}`,
      additionalInfo: isUser ? `
        • Browse thousands of amazing products<br>
        • Enjoy secure checkout and fast delivery<br>
        • Track your orders in real-time<br>
        • Save your favorite items to wishlist
      ` : `
        • Complete your seller profile to get started<br>
        • Upload your first products<br>
        • Set up your payment and shipping preferences<br>
        • Start receiving orders from customers
      `,
      footerText: `Welcome to the 3D E-commerce family! We're here to help you ${isUser ? 'find amazing products' : 'succeed as a seller'}.`
    }

    const htmlContent = this.generateEmailTemplate(templateData)
    const textContent = this.generateTextTemplate(templateData)

    return await this.sendEmail({
      to: email,
      subject: `🎉 Welcome to 3D E-commerce Platform - ${isUser ? 'Start Shopping' : 'Get Started Selling'}!`,
      html: htmlContent,
      text: textContent,
      emailType: 'welcome_email',
      recipientType: recipient.type
    })
  }

  // Account status notification
  async sendAccountStatusUpdate(email, status, reason = '') {
    const recipient = await this.detectRecipientType(email)
    
    if (recipient.type === 'unknown') {
      throw new Error('No account found with this email address')
    }

    const isApproval = status === 'approved'
    const isRejection = status === 'rejected'
    const isSuspension = status === 'suspended'

    const templateData = {
      title: `Your ${recipient.type === 'seller' ? 'Seller' : 'User'} Account ${isApproval ? 'Approved' : isRejection ? 'Update' : 'Status Update'}`,
      recipientName: recipient.name,
      recipientType: recipient.type,
      isUrgent: isSuspension,
      message: `
        ${isApproval ? 
          `Great news! Your ${recipient.type} account has been reviewed and approved by our team. You can now ${recipient.type === 'seller' ? 'start selling on our platform' : 'access all features of our platform'}.` :
          isRejection ?
          `We have reviewed your ${recipient.type} account application. Unfortunately, we cannot approve your account at this time. ${reason ? `Reason: ${reason}` : ''}` :
          `Your ${recipient.type} account status has been updated to: ${status}. ${reason ? `Reason: ${reason}` : ''}`
        }
      `,
      buttonText: isApproval ? (recipient.type === 'seller' ? 'Start Selling Now' : 'Explore Platform') : 'Contact Support',
      buttonUrl: isApproval ? 
        `${process.env.CLIENT_URL || 'http://localhost:3000'}${recipient.type === 'seller' ? '/seller/login' : '/products'}` :
        `${process.env.CLIENT_URL || 'http://localhost:3000'}/support`,
      additionalInfo: isApproval ? (recipient.type === 'seller' ? `
        • Your account is now fully activated<br>
        • You can add unlimited products<br>
        • Access to seller analytics and reports<br>
        • Priority customer support
      ` : `
        • Full access to all platform features<br>
        • Secure shopping and checkout<br>
        • Order tracking and history<br>
        • Customer support available 24/7
      `) : `
        • If you have questions, please contact our support team<br>
        • You can reapply after addressing any issues<br>
        • Our team is here to help you succeed
      `,
      footerText: isApproval ? 
        `Thank you for choosing 3D E-commerce Platform. Let's ${recipient.type === 'seller' ? 'grow your business' : 'find amazing products'} together!` :
        'If you have any questions or concerns, please don\'t hesitate to contact our support team.'
    }

    const htmlContent = this.generateEmailTemplate(templateData)
    const textContent = this.generateTextTemplate(templateData)

    return await this.sendEmail({
      to: email,
      subject: `${isApproval ? '✅' : isRejection ? '📋' : '⚠️'} ${recipient.type === 'seller' ? 'Seller' : 'User'} Account ${isApproval ? 'Approved' : 'Status Update'} - 3D E-commerce`,
      html: htmlContent,
      text: textContent,
      emailType: isApproval ? (recipient.type === 'seller' ? 'seller_approval' : 'account_verification') : 'account_status_update',
      recipientType: recipient.type
    })
  }

  // Order notification (for users)
  async sendOrderNotification(email, orderData, notificationType = 'confirmation') {
    const recipient = await this.detectRecipientType(email)
    
    if (recipient.type !== 'user') {
      throw new Error('Order notifications are only sent to users')
    }

    const statusMessages = {
      confirmation: 'Your order has been confirmed and is being processed.',
      shipped: 'Great news! Your order has been shipped and is on its way.',
      delivered: 'Your order has been delivered successfully.',
      cancelled: 'Your order has been cancelled as requested.'
    }

    const templateData = {
      title: `Order ${notificationType.charAt(0).toUpperCase() + notificationType.slice(1)} - #${orderData.orderNumber}`,
      recipientName: recipient.name,
      recipientType: recipient.type,
      message: statusMessages[notificationType] || 'Your order status has been updated.',
      buttonText: 'View Order Details',
      buttonUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/orders/${orderData._id}`,
      additionalInfo: `
        • Order Number: ${orderData.orderNumber}<br>
        • Order Total: ₹${orderData.totalAmount}<br>
        • Items: ${orderData.items?.length || 0} item(s)<br>
        • ${notificationType === 'shipped' ? `Tracking Number: ${orderData.trackingNumber || 'Will be provided soon'}` : ''}
      `,
      footerText: 'Thank you for shopping with 3D E-commerce Platform!'
    }

    const htmlContent = this.generateEmailTemplate(templateData)
    const textContent = this.generateTextTemplate(templateData)

    return await this.sendEmail({
      to: email,
      subject: `📦 Order ${notificationType.charAt(0).toUpperCase() + notificationType.slice(1)} - ${orderData.orderNumber}`,
      html: htmlContent,
      text: textContent,
      emailType: 'order_' + notificationType,
      recipientType: recipient.type
    })
  }

  // Test email with recipient detection
  async sendTestEmail(email) {
    const recipient = await this.detectRecipientType(email)

    const templateData = {
      title: 'Email Service Test - Recipient Detection',
      recipientName: recipient.name,
      recipientType: recipient.type,
      message: `
        This is a test email to verify that our unified email service is working correctly. 
        We have automatically detected that you are a <strong>${recipient.type}</strong> 
        ${recipient.type === 'seller' ? `with business name: ${recipient.data?.businessName}` : 
          recipient.type === 'user' ? `with customer ID: ${recipient.data?.customerId}` : ''}.
      `,
      buttonText: 'Visit Platform',
      buttonUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}${recipient.type === 'seller' ? '/seller' : '/'}`,
      additionalInfo: `
        • Recipient Type: ${recipient.type}<br>
        • Account Status: ${recipient.status}<br>
        • Email Service: Fully Operational<br>
        • Template System: Working Correctly
      `,
      footerText: 'This is a test email from 3D E-commerce Platform unified email service.'
    }

    const htmlContent = this.generateEmailTemplate(templateData)
    const textContent = this.generateTextTemplate(templateData)

    return await this.sendEmail({
      to: email,
      subject: '🧪 Email Service Test - Unified System Working!',
      html: htmlContent,
      text: textContent,
      emailType: 'test_email',
      recipientType: recipient.type
    })
  }

  // Get email statistics
  async getEmailStats(days = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const stats = await EmailLog.aggregate([
        { $match: { sentAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalEmails: { $sum: 1 },
            sentEmails: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
            failedEmails: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            userEmails: { $sum: { $cond: [{ $eq: ['$recipientType', 'user'] }, 1, 0] } },
            sellerEmails: { $sum: { $cond: [{ $eq: ['$recipientType', 'seller'] }, 1, 0] } }
          }
        }
      ])

      return stats[0] || {
        totalEmails: 0,
        sentEmails: 0,
        failedEmails: 0,
        userEmails: 0,
        sellerEmails: 0
      }
    } catch (error) {
      console.error('Error getting email stats:', error)
      return null
    }
  }
}

// Create singleton instance
const unifiedEmailService = new UnifiedEmailService()

module.exports = unifiedEmailService