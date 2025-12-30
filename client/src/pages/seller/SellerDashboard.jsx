import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Plus,
  TrendingUp,
  DollarSign,
  Eye,
  Settings,
  LogOut,
  Upload,
  Menu,
  X,
  Download,
  User,
  Phone,
  Mail,
  MapPin,
  MessageSquare
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useSellerAuthStore } from '../../store/sellerAuthStore'
import { apiClient } from '../../api/client'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Price from '../../components/ui/Price'
import AddProduct from './AddProduct'
import EditProduct from './EditProduct'
import SellerReviewsManagement from '../../components/seller/ReviewsManagement'
import SellerOrders from './SellerOrders'
import { getImageUrl, createImageErrorHandler } from '../../utils/imageUtils'
import toast from 'react-hot-toast'

// Seller Auth Check Hook
const useSellerAuth = () => {
  const navigate = useNavigate()
  const { isSellerAuthenticated, isLoading, initializeSellerAuth } = useSellerAuthStore()
  
  useEffect(() => {
    initializeSellerAuth()
  }, [initializeSellerAuth])
  
  useEffect(() => {
    if (!isLoading && !isSellerAuthenticated) {
      navigate('/seller/login')
    }
  }, [navigate, isSellerAuthenticated, isLoading])
  
  return isSellerAuthenticated
}

const SellerDashboard = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { seller, sellerLogout } = useSellerAuthStore()
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const isAuthenticated = useSellerAuth()

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats()
    }
  }, [isAuthenticated])

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/seller/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Set empty stats to prevent errors
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        profileViews: 0,
        recentOrders: [],
        topProducts: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    sellerLogout()
    toast.success('Logged out successfully')
    navigate('/seller/login')
  }

  if (!isAuthenticated) {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/seller', icon: BarChart3 },
    { name: 'Products', href: '/seller/products', icon: Package },
    { name: 'Orders', href: '/seller/orders', icon: ShoppingCart },
    { name: 'Reviews', href: '/seller/reviews', icon: MessageSquare },
    { name: 'Analytics', href: '/seller/analytics', icon: TrendingUp },
    { name: 'Settings', href: '/seller/settings', icon: Settings },
  ]

  const isActivePath = (path) => {
    if (path === '/seller') {
      return location.pathname === '/seller'
    }
    return location.pathname.startsWith(path)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen overflow-hidden">
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Seller Panel</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {seller?.businessName}
                </p>
              </div>
              {/* Close button for mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActivePath(item.href)
                        ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-r-2 border-primary-600'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="flex items-center w-full space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Seller Dashboard
              </h1>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto p-4 lg:p-8">
            <Routes>
              <Route path="/" element={<SellerHome stats={stats} />} />
              <Route path="/products" element={<SellerProducts />} />
              <Route path="/products/add" element={<AddProduct />} />
              <Route path="/products/edit/:id" element={<EditProduct />} />
              <Route path="/orders" element={<SellerOrders />} />
              <Route path="/reviews" element={<SellerReviewsManagement />} />
              <Route path="/analytics" element={<SellerAnalytics />} />
              <Route path="/settings" element={<SellerSettings />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  )
}

// Seller Home Component
const SellerHome = ({ stats }) => {
  if (!stats) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: stats?.totalRevenue || 0,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Profile Views',
      value: stats?.profileViews || 0,
      icon: Eye,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Dashboard</h1>
        <div className="flex space-x-4">
          <Link to="/seller/products/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.title === 'Total Revenue' ? (
                      <Price amount={stat.value} />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentOrders />
        <TopProducts />
      </div>
    </div>
  )
}

// Recent Orders Component
const RecentOrders = () => {
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    fetchRecentOrders()
  }, [])

  const fetchRecentOrders = async () => {
    try {
      const response = await apiClient.get('/seller/orders?limit=5')
      setRecentOrders(response.data.orders || [])
    } catch (error) {
      console.error('Failed to fetch recent orders:', error)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Orders
      </h3>
      {recentOrders && recentOrders.length > 0 ? (
        <div className="space-y-4">
          {recentOrders.map((order) => (
            <div key={order._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  #{order.orderNumber || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {order.user?.displayName || 'Unknown Customer'}
                </p>
                {order.user?.phoneNumber && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {order.user.phoneNumber}
                  </p>
                )}
              </div>
              <div className="text-right">
                <Price amount={order.sellerSubtotal || order.total || 0} />
                <p className={`text-sm capitalize ${
                  order.status === 'delivered' ? 'text-green-600' :
                  order.status === 'pending' ? 'text-yellow-600' :
                  order.status === 'cancelled' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {order.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No recent orders</p>
      )}
    </div>
  )
}

// Top Products Component  
const TopProducts = () => {
  const [topProducts, setTopProducts] = useState([])

  useEffect(() => {
    fetchTopProducts()
  }, [])

  const fetchTopProducts = async () => {
    try {
      const response = await apiClient.get('/seller/products/top?limit=5')
      setTopProducts(response.data.products || [])
    } catch (error) {
      console.error('Failed to fetch top products:', error)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top Selling Products
      </h3>
      {topProducts && topProducts.length > 0 ? (
        <div className="space-y-4">
          {topProducts.map((product) => (
            <div key={product._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
                  {product.images && product.images[0] ? (
                    <img
                      src={getImageUrl(product.images[0].url)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={createImageErrorHandler('Product')}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                  <Price amount={product.price} size="sm" className="text-gray-600 dark:text-gray-400" />
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">{product.salesCount || 0} sold</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No sales data available</p>
      )}
    </div>
  )
}

// Seller Products Component
const SellerProducts = () => {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/seller/products')
      setProducts(response.data.products || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProducts = async () => {
    try {
      setIsLoading(true)
      console.log('Refreshing seller products...')
      
      // Clear any cached data and fetch fresh from server with refresh flag
      const response = await apiClient.get('/seller/products?refresh=true', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      console.log('Fresh products data:', response.data)
      console.log('Response timestamp:', response.data.timestamp)
      
      setProducts(response.data.products || [])
      toast.success(`Products refreshed! (${response.data.timestamp})`)
    } catch (error) {
      console.error('Failed to refresh products:', error)
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.')
      } else {
        toast.error('Failed to refresh products: ' + (error.response?.data?.message || error.message))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await apiClient.delete(`/seller/products/${productId}`)
      
      if (response.data.success) {
        // Update the product status in local state
        setProducts(products.map(product => 
          product._id === productId 
            ? { ...product, status: 'inactive' }
            : product
        ))
        toast.success('Product deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast.error(error.response?.data?.message || 'Failed to delete product')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Products</h2>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={refreshProducts} disabled={isLoading}>
            <Package className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link to="/seller/products/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => (
                <motion.tr
                  key={product._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
                        {product.images?.[0] ? (
                          <img
                            className="h-10 w-10 object-cover"
                            src={getImageUrl(product.images[0].url)}
                            alt={product.name}
                            onError={createImageErrorHandler('Product')}
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {product.description?.substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <Price amount={product.price} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.stock || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {product.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Link to={`/seller/products/edit/${product._id}`}>
                      <Button size="small" variant="outline">
                        Edit
                      </Button>
                    </Link>
                    <Button 
                      size="small" 
                      variant="danger"
                      onClick={() => handleDeleteProduct(product._id, product.name)}
                    >
                      Delete
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start by adding your first product to your store.
          </p>
          <Link to="/seller/products/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

const SellerAnalytics = () => {
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get(`/seller/analytics?days=${dateRange}`)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast.error('Failed to load analytics')
      // Set default analytics to prevent errors
      setAnalytics({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        averageOrderValue: 0,
        topProducts: [],
        revenueByMonth: [],
        ordersByStatus: {}
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                <Price amount={analytics?.totalRevenue || 0} />
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics?.totalOrders || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics?.totalProducts || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                <Price amount={analytics?.averageOrderValue || 0} />
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Selling Products
          </h3>
          {analytics?.topProducts && analytics.topProducts.length > 0 ? (
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <Price amount={product.price} />
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.salesCount || 0} sold
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <Price amount={(product.price || 0) * (product.salesCount || 0)} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No sales data available</p>
            </div>
          )}
        </div>

        {/* Orders by Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Orders by Status
          </h3>
          {analytics?.ordersByStatus && Object.keys(analytics.ordersByStatus).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'delivered' ? 'bg-green-500' :
                      status === 'shipped' ? 'bg-blue-500' :
                      status === 'processing' ? 'bg-yellow-500' :
                      status === 'cancelled' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="capitalize text-gray-900 dark:text-white">
                      {status}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No order data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Seller Orders Component
const SellerOrdersComponent = () => {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const updateOrderStatus = async (orderId, newStatus, shippingData = {}) => {
    try {
      console.log('Updating order status:', { orderId, newStatus, shippingData })
      
      const requestData = {
        status: newStatus,
        note: `Status updated to ${newStatus}`,
        ...shippingData
      }
      
      const response = await apiClient.put(`/seller/orders/${orderId}/status`, requestData)
      
      if (response.data.success) {
        const updatedOrder = response.data.order
        
        // Update the order in the local state
        setOrders(orders.map(order => 
          order._id === orderId 
            ? { ...order, ...updatedOrder }
            : order
        ))
        
        // Update selected order if it's the same one
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, ...updatedOrder })
        }
        
        toast.success(`Order status updated to ${newStatus}`)
        return updatedOrder
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error('Failed to update order status: ' + (error.response?.data?.message || error.message))
      throw error
    }
  }

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      
      console.log('Fetching seller orders...')
      const response = await apiClient.get(`/seller/orders?${params.toString()}`)
      console.log('Seller orders response:', response.data)
      
      if (response.data.debug) {
        console.log('Debug info:', response.data.debug)
      }
      
      setOrders(response.data.orders || [])
      
      if (response.data.orders && response.data.orders.length > 0) {
        toast.success(`Found ${response.data.orders.length} orders`)
      } else {
        console.log('No orders found. Debug info:', response.data.debug)
        if (response.data.debug?.totalOrdersInSystem === 0) {
          toast.info('No orders in the system yet')
        } else if (response.data.debug?.ordersWithSellerItems === 0) {
          toast.info('No orders contain your products yet')
        }
      }
    } catch (error) {
      console.error('Failed to fetch seller orders:', error)
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please login again.')
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Please check your seller permissions.')
      } else {
        toast.error('Failed to load orders: ' + (error.response?.data?.message || error.message))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const generateOrderId = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `ORD-${timestamp}-${random}`
  }

  const downloadPDFInvoice = async (order) => {
    try {
      console.log('Downloading PDF invoice for order:', order._id)
      
      const response = await apiClient.get(`/orders/${order._id}/pdf-invoice`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      })
      
      console.log('PDF Invoice response received:', response.status)
      
      // Create blob URL and download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${order.orderNumber || order._id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('PDF Invoice downloaded successfully!')
    } catch (error) {
      console.error('Failed to download PDF invoice:', error)
      
      // Handle different error types
      if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Invoice is not available for this order status')
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to download this invoice')
      } else if (error.response?.status === 404) {
        toast.error('Order not found')
      } else {
        toast.error('Failed to download PDF invoice. Please try again.')
      }
    }
  }

  const downloadTextInvoice = (order) => {
    // Create text content for seller's items only (backup option)
    const textContent = `
SELLER ORDER DETAILS
===================

Order ID: ${order.orderNumber || generateOrderId()}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Status: ${order.status}

CUSTOMER DETAILS:
Name: ${order.user?.displayName || 'N/A'}
Email: ${order.user?.email || 'N/A'}
Phone: ${order.user?.phoneNumber || 'N/A'}
Customer ID: ${order.user?.customerId || 'N/A'}

SHIPPING ADDRESS:
${order.shippingAddress?.street || 'N/A'}
${order.shippingAddress?.city || 'N/A'}, ${order.shippingAddress?.state || 'N/A'}
${order.shippingAddress?.zipCode || 'N/A'}

YOUR PRODUCTS IN THIS ORDER:
${order.items?.map(item => 
  `- ${item.product?.name || 'Product'} x${item.quantity} - ₹${item.price * item.quantity}`
).join('\n') || 'No items'}

YOUR TOTAL: ₹${order.sellerSubtotal || 0}
ITEMS COUNT: ${order.sellerItemCount || 0}
    `
    
    // Create and download text file
    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seller-order-${order.orderNumber || generateOrderId()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Order details downloaded as text file')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h2>
        <div className="flex space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button onClick={fetchOrders}>Refresh Orders</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Your Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Your Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <motion.tr
                  key={order._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    #{order.orderNumber || generateOrderId()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div>
                      <div className="font-medium">{order.user?.displayName || 'N/A'}</div>
                      <div className="text-xs flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {order.user?.email || 'N/A'}
                      </div>
                      {order.user?.phoneNumber && (
                        <div className="text-xs flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {order.user.phoneNumber}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {order.sellerItemCount || order.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <Price amount={order.sellerSubtotal || order.total || 0} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : order.status === 'shipped'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : order.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {order.status || 'pending'}
                      </span>
                      
                      {/* Quick Status Update */}
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="primary"
                      onClick={() => downloadPDFInvoice(order)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => downloadTextInvoice(order)}
                      className="text-xs"
                    >
                      TXT
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {statusFilter ? `No orders with status "${statusFilter}"` : 'You haven\'t received any orders yet.'}
          </p>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Order Details - Your Items
              </h3>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Customer Information</h4>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {selectedOrder.user?.displayName || 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {selectedOrder.user?.email || 'N/A'}
                  </div>
                  {selectedOrder.user?.phoneNumber && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {selectedOrder.user.phoneNumber}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Customer ID: {selectedOrder.user?.customerId || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Order Status Management</h4>
                <div className="space-y-4 mt-2">
                  <div className="flex items-center space-x-4">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedOrder.status === 'delivered'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : selectedOrder.status === 'shipped'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : selectedOrder.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : selectedOrder.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      Current: {selectedOrder.status}
                    </span>
                  </div>
                  
                  {/* Shipping Information Form */}
                  {(selectedOrder.status === 'processing' || selectedOrder.status === 'shipped') && (
                    <ShippingInfoForm 
                      order={selectedOrder}
                      onUpdate={(updatedOrder) => {
                        setSelectedOrder(updatedOrder)
                        setOrders(orders.map(order => 
                          order._id === updatedOrder._id ? updatedOrder : order
                        ))
                      }}
                    />
                  )}
                  
                  {/* Display existing shipping info */}
                  {selectedOrder.shippingInfo && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Shipping Information</h5>
                      <div className="text-sm space-y-1">
                        {selectedOrder.shippingInfo.carrier && (
                          <div><strong>Carrier:</strong> {selectedOrder.shippingInfo.carrier}</div>
                        )}
                        {selectedOrder.shippingInfo.trackingNumber && (
                          <div><strong>Tracking Number:</strong> {selectedOrder.shippingInfo.trackingNumber}</div>
                        )}
                        {selectedOrder.shippingInfo.estimatedDelivery && (
                          <div><strong>Estimated Delivery:</strong> {new Date(selectedOrder.shippingInfo.estimatedDelivery).toLocaleDateString()}</div>
                        )}
                        {selectedOrder.shippingInfo.shippedAt && (
                          <div><strong>Shipped At:</strong> {new Date(selectedOrder.shippingInfo.shippedAt).toLocaleString()}</div>
                        )}
                        {selectedOrder.shippingInfo.deliveredAt && (
                          <div><strong>Delivered At:</strong> {new Date(selectedOrder.shippingInfo.deliveredAt).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Shipping Address</h4>
                <div className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    {selectedOrder.shippingAddress?.street || 'N/A'}<br />
                    {selectedOrder.shippingAddress?.city || 'N/A'}, {selectedOrder.shippingAddress?.state || 'N/A'}<br />
                    {selectedOrder.shippingAddress?.zipCode || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Your Products in this Order</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span>{item.product?.name || 'Product'} x{item.quantity}</span>
                      <Price amount={item.price * item.quantity} />
                    </div>
                  )) || <p className="text-sm text-gray-500">No items</p>}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Your Total:</span>
                  <Price amount={selectedOrder.sellerSubtotal || selectedOrder.total || 0} />
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span>Items Count:</span>
                  <span>{selectedOrder.sellerItemCount || selectedOrder.items?.length || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

// Shipping Information Form Component
const ShippingInfoForm = ({ order, onUpdate }) => {
  const [formData, setFormData] = useState({
    carrier: order.shippingInfo?.carrier || '',
    trackingNumber: order.shippingInfo?.trackingNumber || '',
    estimatedDelivery: order.shippingInfo?.estimatedDelivery 
      ? new Date(order.shippingInfo.estimatedDelivery).toISOString().split('T')[0] 
      : ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const shippingData = {
        carrier: formData.carrier,
        trackingNumber: formData.trackingNumber,
        estimatedDelivery: formData.estimatedDelivery
      }

      const response = await apiClient.put(`/seller/orders/${order._id}/status`, {
        status: order.status, // Keep current status
        note: 'Shipping information updated',
        ...shippingData
      })

      if (response.data.success) {
        onUpdate(response.data.order)
        toast.success('Shipping information updated successfully')
      }
    } catch (error) {
      console.error('Failed to update shipping info:', error)
      toast.error('Failed to update shipping information')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <h5 className="font-medium text-gray-900 dark:text-white mb-3">
        {order.status === 'processing' ? 'Add Shipping Information' : 'Update Shipping Information'}
      </h5>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Carrier
            </label>
            <select
              name="carrier"
              value={formData.carrier}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Select Carrier</option>
              <option value="FedEx">FedEx</option>
              <option value="UPS">UPS</option>
              <option value="DHL">DHL</option>
              <option value="USPS">USPS</option>
              <option value="Blue Dart">Blue Dart</option>
              <option value="DTDC">DTDC</option>
              <option value="Delhivery">Delhivery</option>
              <option value="Ekart">Ekart</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tracking Number
            </label>
            <input
              type="text"
              name="trackingNumber"
              value={formData.trackingNumber}
              onChange={handleChange}
              placeholder="Enter tracking number"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estimated Delivery Date
          </label>
          <input
            type="date"
            name="estimatedDelivery"
            value={formData.estimatedDelivery}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
        </div>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            size="small"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Shipping Info'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Seller Settings Component
const SellerSettings = () => {
  const { seller } = useSellerAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: seller?.businessName || '',
    email: seller?.email || '',
    phoneNumber: seller?.phoneNumber || '',
    address: seller?.address || '',
    description: seller?.description || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await apiClient.put('/seller/profile', formData)
      
      if (response.data.success) {
        toast.success('Profile updated successfully')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your seller account settings</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Business Information
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Business Name
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Business Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Describe your business..."
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SellerDashboard
