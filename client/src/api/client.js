import axios from 'axios'
import { useUserAuthStore } from '../store/userAuthStore'
import { useAdminAuthStore } from '../store/adminAuthStore'
import { useSellerAuthStore } from '../store/sellerAuthStore'
import { STORAGE_KEYS } from '../store/authTypes'
import toast from 'react-hot-toast'

// Create axios instance
const API_BASE =
  (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) ||
  (typeof window !== 'undefined' && `${window.location.origin}/api`) ||
  'http://localhost:5000/api'

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    
    // Get tokens from localStorage
    const adminToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
    const sellerToken = localStorage.getItem(STORAGE_KEYS.SELLER_TOKEN)
    const userToken = localStorage.getItem(STORAGE_KEYS.USER_TOKEN)
    
    console.log('Available tokens:', {
      admin: !!adminToken,
      seller: !!sellerToken,
      user: !!userToken
    })
    
    // Determine which token to use based on route
    let tokenToUse = null
    
    if (config.url?.includes('/admin')) {
      tokenToUse = adminToken
      console.log('Using admin token for admin route')
    } else if (config.url?.includes('/seller')) {
      tokenToUse = sellerToken
      console.log('Using seller token for seller route')
    } else {
      // For general routes, prioritize: admin > seller > user
      tokenToUse = adminToken || sellerToken || userToken
      console.log('Using token for general route:', tokenToUse ? 'found' : 'none')
    }
    
    if (tokenToUse) {
      config.headers.Authorization = `Bearer ${tokenToUse}`
      console.log('Authorization header set')
    } else {
      console.log('No token available for request')
    }
    
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for token refresh and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.config?.url, error.response?.data?.message)
    
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      console.log('401 error - handling token expiration')
      
      // Handle different auth types based on URL
      if (originalRequest.url?.includes('/admin')) {
        console.log('Admin token expired, logging out')
        useAdminAuthStore.getState().adminLogout()
        toast.error('Admin session expired. Please login again.')
        window.location.href = '/admin/login'
        return Promise.reject(error)
      }
      
      if (originalRequest.url?.includes('/seller')) {
        console.log('Seller token expired, logging out')
        useSellerAuthStore.getState().sellerLogout()
        toast.error('Seller session expired. Please login again.')
        window.location.href = '/seller/login'
        return Promise.reject(error)
      }
      
      // User token expired - try to refresh
      console.log('User token expired, attempting refresh')
      try {
        const response = await apiClient.post('/auth/refresh', {}, { withCredentials: true })
        
        const { accessToken } = response.data
        
        // Update token in store
        useUserAuthStore.getState().setUserToken(accessToken)
        localStorage.setItem(STORAGE_KEYS.USER_TOKEN, accessToken)
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
        
      } catch (refreshError) {
        // Refresh failed, logout user
        console.error('Token refresh failed:', refreshError)
        useUserAuthStore.getState().userLogout()
        toast.error('Session expired. Please login again.')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
    // Handle other errors
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.response?.status === 403) {
      toast.error('Access denied.')
    } else if (error.response?.data?.message && !originalRequest._retry) {
      // Only show error message if it's not a retry attempt
      toast.error(error.response.data.message)
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
