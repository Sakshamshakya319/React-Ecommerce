const nodemailer = require('nodemailer')
const path = require('path')
const fs = require('fs').promises

class EmailService {
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
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS // Use App Password for Gmail
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
      console.error('❌ Email service configuration error:', error.message)
    }
  }

  async verifyConnection() {
    if (!this.transporter) return

    try {
      await this.transporter.verify()
      console.log('✅ Email service initialized successfully')
      console.log(`📧 Configured for: ${process.env.EMAIL_USER}`)
    } catch (error) {
      console.warn('⚠️  Email service connection warning:', error.message)
      console.warn('   (Service will attempt to reconnect when sending emails)')

      // Provide helpful error messages
      if (error.message.includes('Invalid login')) {
        console.error('💡 Hint: Check EMAIL_USER and EMAIL_PASS in .env file')
        console.error('💡 For Gmail: Use App Password, not regular password')
        console.error('💡 Generate App Password: Google Account > Security > 2-Step Verification > App passwords')
      }
    }
  }

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
      return result
      
    } catch (error) {
      console.error('❌ Failed to send email:', error.message)
      throw error
    }
  }

  // Generate HTML email template
  generateEmailTemplate(templateData) {
    const { 
      title, 
      businessName, 
      message, 
      buttonText, 
      buttonUrl, 
      additionalInfo,
      footerText 
    } = templateData

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
                border-radius: 10px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #6366f1;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #6366f1;
                margin-bottom: 10px;
            }
            .title {
                font-size: 24px;
                color: #1f2937;
                margin-bottom: 20px;
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
            .reset-button {
                display: inline-block;
                background-color: #6366f1;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                transition: background-color 0.3s;
            }
            .reset-button:hover {
                background-color: #4f46e5;
            }
            .additional-info {
                background-color: #f3f4f6;
                padding: 20px;
                border-radius: 8px;
                margin: 30px 0;
                border-left: 4px solid #6366f1;
            }
            .security-note {
                background-color: #fef3c7;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #f59e0b;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #9ca3af;
                font-size: 14px;
            }
            .contact-info {
                margin-top: 20px;
                font-size: 14px;
                color: #6b7280;
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
                .reset-button {
                    padding: 12px 24px;
                    font-size: 14px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">🛍️ 3D E-commerce</div>
                <div class="title">${title}</div>
            </div>
            
            <div class="greeting">
                Hello ${businessName || 'Seller'},
            </div>
            
            <div class="message">
                ${message}
            </div>
            
            ${buttonUrl ? `
            <div class="button-container">
                <a href="${buttonUrl}" class="reset-button">${buttonText || 'Reset Password'}</a>
            </div>
            ` : ''}
            
            ${additionalInfo ? `
            <div class="additional-info">
                <strong>Important Information:</strong><br>
                ${additionalInfo}
            </div>
            ` : ''}
            
            <div class="security-note">
                <strong>🔒 Security Note:</strong> This link will expire in 1 hour for your security. 
                If you didn't request this password reset, please ignore this email or contact our support team.
            </div>
            
            <div class="contact-info">
                <strong>Need Help?</strong><br>
                If you're having trouble with the button above, copy and paste the following URL into your web browser:<br>
                <a href="${buttonUrl}" style="color: #6366f1; word-break: break-all;">${buttonUrl}</a>
            </div>
            
            <div class="footer">
                ${footerText || 'This email was sent from 3D E-commerce Platform. Please do not reply to this email.'}<br>
                <br>
                © ${new Date().getFullYear()} 3D E-commerce Platform. All rights reserved.<br>
                <strong>Seller Support:</strong> seller-support@3decommerce.com
            </div>
        </div>
    </body>
    </html>
    `
  }

  // Generate plain text version for email clients that don't support HTML
  generateTextTemplate(templateData) {
    const { title, businessName, message, buttonUrl, additionalInfo } = templateData

    return `
${title}
${'='.repeat(title.length)}

Hello ${businessName || 'Seller'},

${message}

${buttonUrl ? `Reset your password by visiting this link: ${buttonUrl}` : ''}

${additionalInfo ? `Important Information: ${additionalInfo}` : ''}

Security Note: This link will expire in 1 hour for your security. 
If you didn't request this password reset, please ignore this email.

Need Help? Contact our support team at seller-support@3decommerce.com

© ${new Date().getFullYear()} 3D E-commerce Platform. All rights reserved.
    `.trim()
  }

  async sendSellerPasswordReset(sellerEmail, businessName, resetUrl) {
    const templateData = {
      title: 'Reset Your Seller Account Password',
      businessName,
      message: `
        We received a request to reset the password for your seller account. 
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
      to: sellerEmail,
      subject: '🔐 Reset Your Seller Account Password - 3D E-commerce',
      html: htmlContent,
      text: textContent
    })
  }

  async sendSellerWelcomeEmail(sellerEmail, businessName) {
    const templateData = {
      title: 'Welcome to 3D E-commerce Platform!',
      businessName,
      message: `
        Congratulations! Your seller account has been successfully created. 
        We're excited to have you join our platform and start selling your products.
      `,
      buttonText: 'Access Seller Dashboard',
      buttonUrl: `${process.env.CLIENT_URL}/seller/login`,
      additionalInfo: `
        • Complete your seller profile to get started<br>
        • Upload your first products<br>
        • Set up your payment and shipping preferences<br>
        • Start receiving orders from customers
      `,
      footerText: 'Welcome to the 3D E-commerce family! We\'re here to help you succeed.'
    }

    const htmlContent = this.generateEmailTemplate(templateData)
    const textContent = this.generateTextTemplate(templateData)

    return await this.sendEmail({
      to: sellerEmail,
      subject: '🎉 Welcome to 3D E-commerce Platform - Get Started!',
      html: htmlContent,
      text: textContent
    })
  }

  async sendSellerAccountApproval(sellerEmail, businessName) {
    const templateData = {
      title: 'Your Seller Account Has Been Approved!',
      businessName,
      message: `
        Great news! Your seller account has been reviewed and approved by our team. 
        You can now start selling on our platform and reach thousands of customers.
      `,
      buttonText: 'Start Selling Now',
      buttonUrl: `${process.env.CLIENT_URL}/seller/login`,
      additionalInfo: `
        • Your account is now fully activated<br>
        • You can add unlimited products<br>
        • Access to seller analytics and reports<br>
        • Priority customer support
      `,
      footerText: 'Thank you for choosing 3D E-commerce Platform. Let\'s grow your business together!'
    }

    const htmlContent = this.generateEmailTemplate(templateData)
    const textContent = this.generateTextTemplate(templateData)

    return await this.sendEmail({
      to: sellerEmail,
      subject: '✅ Seller Account Approved - Start Selling Today!',
      html: htmlContent,
      text: textContent
    })
  }

  async sendSellerAccountDeletion(sellerEmail, businessName) {
    const templateData = {
      title: 'Seller Account Deleted',
      businessName: businessName,
      message: `We regret to inform you that your seller account for "${businessName}" has been permanently deleted from our platform.`,
      buttonText: 'Contact Support',
      buttonUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/contact`,
      additionalInfo: `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #dc2626; margin: 0 0 8px 0;">Account Deletion Details:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li>Your seller account has been permanently removed</li>
            <li>All your products have been deactivated</li>
            <li>Order history has been preserved for record-keeping</li>
            <li>You will no longer be able to access the seller dashboard</li>
          </ul>
        </div>
        <p style="color: #6b7280;">If you believe this action was taken in error or have questions about this decision, please contact our support team immediately.</p>
        <p style="color: #6b7280;">Thank you for being part of our platform.</p>
      `,
      footerText: 'This is an automated notification from 3D E-commerce Platform.'
    }

    const htmlContent = this.generateEmailTemplate(templateData)
    const textContent = this.generateTextTemplate(templateData)

    return await this.sendEmail({
      to: sellerEmail,
      subject: '🚨 Seller Account Deleted - 3D E-commerce Platform',
      html: htmlContent,
      text: textContent
    })
  }

  // Test email functionality
  async sendTestEmail(toEmail) {
    const templateData = {
      title: 'Email Service Test',
      businessName: 'Test User',
      message: 'This is a test email to verify that the email service is working correctly.',
      buttonText: 'Visit Website',
      buttonUrl: process.env.CLIENT_URL || 'http://localhost:3000',
      additionalInfo: 'If you received this email, the email service is configured properly.',
      footerText: 'This is a test email from 3D E-commerce Platform.'
    }

    const htmlContent = this.generateEmailTemplate(templateData)
    const textContent = this.generateTextTemplate(templateData)

    return await this.sendEmail({
      to: toEmail,
      subject: '🧪 Email Service Test - 3D E-commerce',
      html: htmlContent,
      text: textContent
    })
  }
}

// Create singleton instance
const emailService = new EmailService()

module.exports = emailService