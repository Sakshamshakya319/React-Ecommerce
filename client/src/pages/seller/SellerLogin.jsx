import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Store, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Button from '../../components/ui/Button'
import { useSellerAuthStore } from '../../store/sellerAuthStore'
import { apiClient } from '../../api/client'
import toast from 'react-hot-toast'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../config/firebase'

const SellerLogin = () => {
  const navigate = useNavigate()
  const { sellerLogin } = useSellerAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

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
      console.log('Seller login attempt:', { email: formData.email })
      
      // Validate form data
      if (!formData.email || !formData.password) {
        throw new Error('Email and password are required')
      }
      
      const response = await apiClient.post('/seller/login', {
        email: formData.email.trim(),
        password: formData.password
      })
      
      console.log('Seller login response:', response.data)
      
      if (response.data.success && response.data.token && response.data.seller) {
        console.log('Seller login successful, storing data...')
        
        // Use seller auth store
        sellerLogin(response.data.seller, response.data.token)
        
        // Validate token before redirecting to dashboard
        try {
          await apiClient.get('/seller/validate-token')
          console.log('Seller token validated successfully')
        } catch (validationError) {
          console.error('Seller token validation failed:', validationError)
          const { sellerLogout } = useSellerAuthStore.getState()
          sellerLogout()
          throw new Error(validationError.response?.data?.message || 'Session invalid. Please login again.')
        }
        
        // Verify storage
        setTimeout(() => {
          const storedToken = localStorage.getItem('sellerToken')
          const storedData = localStorage.getItem('sellerData')
          console.log('Verification - Token stored:', !!storedToken)
          console.log('Verification - Data stored:', !!storedData)
        }, 100)
        
        toast.success(`Welcome ${response.data.seller.businessName}!`)
        navigate('/seller')
      } else {
        throw new Error('Invalid response from server - missing token or seller data')
      }
    } catch (error) {
      console.error('Seller login error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.'
      if (errorMessage.includes('pending') || errorMessage.includes('not approved')) {
        toast.error('Your seller account is not approved yet. Please wait for approval.')
      } else if (errorMessage.includes('Invalid credentials')) {
        toast.error('Invalid email or password. If you were just approved, use the password from the approval email or reset it.')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      
      const idToken = await user.getIdToken()
      
      const response = await apiClient.post('/seller/firebase-login', {
        idToken,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: 'google'
      })
      
      sellerLogin(response.data.seller, response.data.token)
      toast.success('Google login successful!')
      navigate('/seller')
      
    } catch (error) {
      console.error('Seller Google login error:', error)
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Login cancelled')
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup blocked. Please allow popups and try again.')
      } else {
        toast.error(error.response?.data?.message || 'Google login failed')
      }
    } finally {
      setIsLoading(false)
    }
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
            <div className="w-16 h-16 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center">
              <Store className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Seller Login
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Access your seller dashboard
          </p>
        </div>

        {/* Login Form */}
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
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
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
                  placeholder="Enter your password"
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
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/seller/forgot-password"
                  className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.4v2.88h5.44c-.24 1.42-1.6 4.16-5.44 4.16c-3.28 0-5.96-2.72-5.96-6.08s2.68-6.08 5.96-6.08c1.88 0 3.14.8 3.86 1.48l2.64-2.56C17.42 3.38 15.56 2.5 12.95 2.5C7.64 2.5 3.5 6.64 3.5 12s4.14 9.5 9.45 9.5c5.46 0 9.05-3.84 9.05-9.24c0-.62-.06-1.06-.15-1.16z"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have a seller account?{' '}
            <Link
              to="/seller/register"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
            >
              Register here
            </Link>
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <Link
              to="/"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
            >
              ← Back to Store
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default SellerLogin
