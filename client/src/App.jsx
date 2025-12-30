import React, { Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useUserAuthStore } from './store/userAuthStore'
import { useAdminAuthStore } from './store/adminAuthStore'
import { useSellerAuthStore } from './store/sellerAuthStore'
import { useCartStore } from './store/cartStore'
import { useThemeStore } from './store/themeStore'

// Layout Components
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ErrorBoundary from './components/ui/ErrorBoundary'

// Pages - Lazy loaded for better performance
const Home = React.lazy(() => import('./pages/Home'))
const Products = React.lazy(() => import('./pages/Products'))
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'))
const Cart = React.lazy(() => import('./pages/Cart'))
const Checkout = React.lazy(() => import('./pages/Checkout'))
const Profile = React.lazy(() => import('./pages/Profile'))
const Wishlist = React.lazy(() => import('./pages/Wishlist'))
const Orders = React.lazy(() => import('./pages/Orders'))
const OrderDetail = React.lazy(() => import('./pages/OrderDetail'))
const Login = React.lazy(() => import('./pages/auth/Login'))
const Register = React.lazy(() => import('./pages/auth/Register'))
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'))
const ChangePassword = React.lazy(() => import('./pages/auth/ChangePassword'))
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'))
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'))
const SellerLogin = React.lazy(() => import('./pages/seller/SellerLogin'))
const SellerRegister = React.lazy(() => import('./pages/seller/SellerRegister'))
const SellerForgotPassword = React.lazy(() => import('./pages/seller/SellerForgotPassword'))
const SellerResetPassword = React.lazy(() => import('./pages/seller/SellerResetPassword'))
const SellerDashboard = React.lazy(() => import('./pages/seller/SellerDashboard'))

// Protected Route Component for Users
const UserProtectedRoute = ({ children }) => {
  const { isUserAuthenticated, isLoading } = useUserAuthStore()
  const location = useLocation()
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }
  
  if (!isUserAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return children
}

// Protected Route Component for Admins
const AdminProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated, isLoading } = useAdminAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }
  
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }
  
  return children
}

// Protected Route Component for Sellers
const SellerProtectedRoute = ({ children }) => {
  const { isSellerAuthenticated, isLoading } = useSellerAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }
  
  if (!isSellerAuthenticated) {
    return <Navigate to="/seller/login" replace />
  }
  
  return children
}

function App() {
  const { initializeUserAuth, isLoading: userLoading } = useUserAuthStore()
  const { initializeAdminAuth } = useAdminAuthStore()
  const { initializeSellerAuth } = useSellerAuthStore()
  const { initializeCart } = useCartStore()
  const { initializeTheme } = useThemeStore()

  useEffect(() => {
    // Initialize all authentication systems, cart, and theme on app start
    console.log('App initializing...')
    initializeUserAuth()
    initializeAdminAuth()
    initializeSellerAuth()
    initializeCart()
    initializeTheme()
  }, [initializeUserAuth, initializeAdminAuth, initializeSellerAuth, initializeCart, initializeTheme])

  // Show loading screen while user authentication is being initialized
  if (userLoading) {
    console.log('App loading - user auth initializing...')
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
        <Navbar />
        
        <main className="flex-1">
          <ErrorBoundary fallbackMessage="An error occurred while loading the page. Please refresh and try again.">
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="large" />
              </div>
            }>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/change-password" element={
                  <UserProtectedRoute>
                    <ChangePassword />
                  </UserProtectedRoute>
                } />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Admin Login Route */}
                <Route path="/admin/login" element={<AdminLogin />} />
                
                {/* Seller Routes */}
                <Route path="/seller/login" element={<SellerLogin />} />
                <Route path="/seller/register" element={<SellerRegister />} />
                <Route path="/seller/forgot-password" element={<SellerForgotPassword />} />
                <Route path="/seller/reset-password" element={<SellerResetPassword />} />
                
                {/* Cart Route - Allow access but show login prompt if not authenticated */}
                <Route path="/cart" element={<Cart />} />
                
                {/* Protected User Routes */}
                <Route path="/checkout" element={
                  <UserProtectedRoute>
                    <Checkout />
                  </UserProtectedRoute>
                } />
                <Route path="/profile" element={
                  <UserProtectedRoute>
                    <Profile />
                  </UserProtectedRoute>
                } />
                <Route path="/wishlist" element={
                  <UserProtectedRoute>
                    <Wishlist />
                  </UserProtectedRoute>
                } />
                <Route path="/orders" element={
                  <UserProtectedRoute>
                    <Orders />
                  </UserProtectedRoute>
                } />
                <Route path="/orders/:id" element={
                  <UserProtectedRoute>
                    <OrderDetail />
                  </UserProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin/*" element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                } />
                
                {/* Seller Routes */}
                <Route path="/seller/*" element={
                  <SellerProtectedRoute>
                    <SellerDashboard />
                  </SellerProtectedRoute>
                } />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </Suspense>
        </ErrorBoundary>
      </main>
        
        <Footer />
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
            },
            success: {
              duration: 3000,
              theme: {
                primary: '#4aed88',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App
