import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, User, Menu, X, Search, LogOut, Heart } from 'lucide-react'
import { useUserAuthStore } from '../../store/userAuthStore'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import { useSellerAuthStore } from '../../store/sellerAuthStore'
import { useCartStore } from '../../store/cartStore'
import { useLanguageStore } from '../../store/languageStore'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'
import CurrencySelector from '../ui/CurrencySelector'
import ThemeSwitcher from '../ui/ThemeSwitcher'
import LanguageSelector from '../ui/LanguageSelector'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get authentication states
  const { user, isUserAuthenticated, userLogout, isLoading: userLoading } = useUserAuthStore()
  const { admin, isAdminAuthenticated, adminLogout } = useAdminAuthStore()
  const { seller, isSellerAuthenticated, sellerLogout } = useSellerAuthStore()
  const { getItemCount } = useCartStore()
  const { t } = useLanguageStore()
  
  const cartItemCount = getItemCount()

  // Determine current user type and data
  const getCurrentUser = () => {
    if (isAdminAuthenticated) return { type: 'admin', data: admin }
    if (isSellerAuthenticated) return { type: 'seller', data: seller }
    if (isUserAuthenticated) return { type: 'user', data: user }
    return null
  }

  const currentUser = getCurrentUser()
  const isAuthenticated = currentUser !== null

  const handleLogout = async () => {
    if (isAdminAuthenticated) {
      adminLogout()
      navigate('/admin/login')
    } else if (isSellerAuthenticated) {
      sellerLogout()
      navigate('/seller/login')
    } else if (isUserAuthenticated) {
      userLogout()
      navigate('/')
    }
    setIsProfileMenuOpen(false)
  }

  const navigation = [
    { name: t('home'), href: '/' },
    { name: t('products'), href: '/products' },
  ]

  const isActivePath = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/shoporia.png" 
              alt="Shoporia Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Shoporia</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActivePath(item.href)
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Currency Selector - Desktop only */}
            <div className="hidden md:block">
              <CurrencySelector />
            </div>

            {/* Search - Desktop only */}
            <div className="hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <input
                  type="text"
                  placeholder={t('search')}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`/products?search=${e.target.value}`)
                    }
                  }}
                />
              </div>
            </div>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 dark:bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Wishlist - Only show for authenticated users */}
            {isUserAuthenticated && (
              <Link
                to="/wishlist"
                className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              >
                <Heart className="h-6 w-6" />
                {user?.wishlist && user.wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {user.wishlist.length}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {userLoading ? (
              <LoadingSpinner size="small" />
            ) : isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {currentUser?.data?.photoURL ? (
                    <img
                      src={currentUser.data.photoURL}
                      alt={currentUser.data.displayName || currentUser.data.username || currentUser.data.ownerName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentUser?.data?.displayName || currentUser?.data?.username || currentUser?.data?.ownerName || currentUser?.data?.email}
                  </span>
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {currentUser?.type === 'user' && (
                      <>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          {t('profile')}
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          {t('orders')}
                        </Link>
                        <Link
                          to="/change-password"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Change Password
                        </Link>
                      </>
                    )}
                    {currentUser?.type === 'admin' && (
                      <>
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                        <Link
                          to="/admin/products"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Manage Products
                        </Link>
                        <Link
                          to="/admin/sellers"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Manage Sellers
                        </Link>
                      </>
                    )}
                    {currentUser?.type === 'seller' && (
                      <>
                        <Link
                          to="/seller"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Seller Dashboard
                        </Link>
                        <Link
                          to="/seller/products"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          My Products
                        </Link>
                        <Link
                          to="/seller/orders"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          My Orders
                        </Link>
                      </>
                    )}
                    <hr className="my-1 border-gray-200 dark:border-gray-600" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="inline h-4 w-4 mr-2" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Only show login/signup if not in admin or seller panels
              !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/seller') && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => navigate('/login')}
                  >
                    {t('login')}
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => navigate('/register')}
                  >
                    {t('signup')}
                  </Button>
                </div>
              )
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-primary-600"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActivePath(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Search */}
              <div className="px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        navigate(`/products?search=${e.target.value}`)
                        setIsMobileMenuOpen(false)
                      }
                    }}
                  />
                </div>
              </div>

              {/* Mobile Currency Selector */}
              <div className="px-3 py-2">
                <CurrencySelector />
              </div>

              {/* Mobile Theme Switcher */}
              <div className="px-3 py-2">
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close profile menu */}
      {isProfileMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsProfileMenuOpen(false)}
        />
      )}
    </nav>
  )
}

export default Navbar