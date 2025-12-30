import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Store, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { apiClient } from '../../api/client'
import toast from 'react-hot-toast'

const SellerResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  const [email, setEmail] = useState('')
  
  // Get token from URL
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    verifyResetToken()
  }, [])

  const verifyResetToken = async () => {
    setIsVerifying(true)

    try {
      if (!token) {
        toast.error('Invalid or missing reset token.')
        navigate('/seller/forgot-password')
        return
      }

      // Use unified auth endpoint to verify token
      const response = await apiClient.get(`/unified-auth/verify-reset-token/${token}`)
      
      if (response.data.success) {
        setEmail(response.data.email)
        toast.success('Reset token verified successfully!')
      }
    } catch (error) {
      console.error('Reset token verification error:', error)
      
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid or expired reset token.')
      } else {
        toast.error('Invalid or expired reset token.')
      }
      
      navigate('/seller/forgot-password')
      return
    } finally {
      setIsVerifying(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate passwords
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match')
        return
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long')
        return
      }

      // Reset password using unified auth endpoint
      const response = await apiClient.post('/unified-auth/reset-password', {
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      })

      if (response.data.success) {
        setResetComplete(true)
        toast.success('Password reset successfully!')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid request.')
      } else if (error.response?.status === 404) {
        toast.error('Invalid or expired reset token.')
      } else {
        toast.error('Failed to reset password. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying reset code...</p>
        </div>
      </div>
    )
  }

  if (resetComplete) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full space-y-8"
        >
          {/* Success Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Password Reset Complete!
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your password has been successfully reset
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Your password for <strong>{email}</strong> has been updated successfully.</p>
                <p className="mt-2">You can now login with your new password.</p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Security tip:</strong> Make sure to keep your new password safe and don't share it with anyone.
                </p>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <div className="text-center">
            <Button
              onClick={() => navigate('/seller/login')}
              variant="primary"
              size="large"
              className="w-full"
            >
              Go to Login
            </Button>
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
            Set New Password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your new password for <strong>{email}</strong>
          </p>
        </div>

        {/* Reset Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>✅ Token Verified</strong> - You can now set a new password for your seller account.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be at least 6 characters long</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
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

export default SellerResetPassword