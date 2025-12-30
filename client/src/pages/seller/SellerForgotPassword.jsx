import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Store, Mail, ArrowLeft, Send } from 'lucide-react'
import Button from '../../components/ui/Button'
import { apiClient } from '../../api/client'
import toast from 'react-hot-toast'

const SellerForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [debugResetUrl, setDebugResetUrl] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Use the unified auth endpoint for better email handling
      const response = await apiClient.post('/unified-auth/forgot-password', { email })
      
      if (response.data.success) {
        setEmailSent(true)
        if (response.data.resetUrl) {
          setDebugResetUrl(response.data.resetUrl)
        }
        toast.success('Password reset email sent! Check your inbox.')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid email address.')
      } else {
        toast.error(error.response?.data?.message || 'Failed to send reset email. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                <Send className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Email Sent!
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Next steps:</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Check your email inbox for the reset link</li>
                  <li>Click the link in the email to reset your password</li>
                  <li>Create a new password and save it securely</li>
                  <li>Return to the login page to sign in</li>
                </ol>
              </div>

              {debugResetUrl && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    A development reset link is available. You can proceed directly:
                  </p>
                  <div className="mt-2">
                    <a
                      href={debugResetUrl}
                      className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Open Reset Page
                    </a>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Didn't receive the email?</strong> Check your spam folder or try again in a few minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="text-center space-y-4">
            <Link
              to="/seller/login"
              className="inline-flex items-center space-x-2 text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </Link>
            
            <div>
              <button
                onClick={() => setEmailSent(false)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Try a different email address
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/shoporia.png" 
              alt="Shoporia Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Reset Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Password Reset Process</p>
                <p>Enter your seller account email address and we'll send you a secure link to reset your password. The link will expire in 1 hour for security.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Link
            to="/seller/login"
            className="inline-flex items-center space-x-2 text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default SellerForgotPassword
