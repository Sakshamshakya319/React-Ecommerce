import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../config/firebase'
import { useUserAuthStore } from '../../store/userAuthStore'
import { useCartStore } from '../../store/cartStore'
import { apiClient } from '../../api/client'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  const { userLogin, isUserAuthenticated, isLoading } = useUserAuthStore()
  const { initializeCartAfterLogin } = useCartStore()
  
  const from = location.state?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm()

  // Redirect if already authenticated - but validate token first
  useEffect(() => {
    const validateAndRedirect = async () => {
      console.log('Login component - Auth state:', { isUserAuthenticated, isLoading, from })
      
      if (isUserAuthenticated && !isLoading) {
        try {
          // Validate token with backend before redirecting
          await apiClient.get('/auth/validate-token')
          console.log('Token is valid, redirecting to:', from)
          navigate(from, { replace: true })
        } catch (error) {
          console.log('Token validation failed, clearing auth state')
          // Token is invalid, clear auth state
          const { userLogout } = useUserAuthStore.getState()
          userLogout()
          toast.error('Session expired. Please login again.')
        }
      }
    }
    
    validateAndRedirect()
  }, [isUserAuthenticated, isLoading, navigate, from])

  const onSubmit = async (data) => {
    try {
      console.log('User login attempt:', { email: data.email })
      
      const response = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password
      })
      
      console.log('User login response:', response.data)
      
      if (response.data.success && response.data.token && response.data.user) {
        userLogin(response.data.user, response.data.token)
        
        // Initialize cart after successful login
        await initializeCartAfterLogin()
        
        toast.success('Login successful!')
        
        console.log('Redirecting to:', from)
        navigate(from, { replace: true })
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('User login error:', error)
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.'
      toast.error(errorMessage)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      console.log('Starting Google login...')
      
      // Sign in with Google using Firebase
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      
      console.log('Google login successful:', user.email)
      
      // Get Firebase ID token
      const idToken = await user.getIdToken()
      console.log('Got Firebase ID token')
      
      // Send to backend for JWT creation and user registration/login
      const response = await apiClient.post('/auth/google-login', {
        idToken,
        firebaseUser: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber
        }
      })
      
      console.log('Backend response:', response.data)
      
      // Check if we got the expected response
      if (!response.data.user || !response.data.token) {
        console.error('Invalid response structure:', response.data)
        throw new Error('Invalid response from server: missing user or token')
      }
      
      console.log('About to call userLogin with:', {
        user: response.data.user,
        token: response.data.token
      })
      
      // Use the user auth store to save the user and token
      userLogin(response.data.user, response.data.token)
      
      console.log('userLogin called, checking auth state...')
      
      // Force a small delay to ensure state updates
      setTimeout(() => {
        console.log('Auth state after login:', {
          isUserAuthenticated: useUserAuthStore.getState().isUserAuthenticated,
          user: useUserAuthStore.getState().user
        })
        
        if (useUserAuthStore.getState().isUserAuthenticated) {
          // Initialize cart after successful login
          initializeCartAfterLogin()
          
          toast.success('Google login successful!')
          navigate(from, { replace: true })
        } else {
          console.error('Auth state not updated properly')
          toast.error('Login failed - please try again')
        }
      }, 100)
      
    } catch (error) {
      console.error('Google login error:', error)
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Login cancelled')
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup blocked. Please allow popups and try again.')
      } else if (error.message?.includes('No user after sign in')) {
        toast.error('Authentication failed. Please try again.')
      } else {
        toast.error(error.response?.data?.message || error.message || 'Google login failed')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-gray-600">
            Sign in to your account to continue shopping
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className={`
                    block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    ${errors.email ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`
                    block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    ${errors.password ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Social Login */}
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login