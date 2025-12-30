import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  Package, 
  Users, 
  ShoppingCart, 
  Plus,
  TrendingUp,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Download,
  Store,
  User,
  Minus,
  Menu,
  X,
  MessageSquare
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import { apiClient } from '../../api/client'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Price from '../../components/ui/Price'
import AddProduct from './AddProduct'
import ReviewsManagement from '../../components/admin/ReviewsManagement'
import { getImageUrl, createImageErrorHandler } from '../../utils/imageUtils'
import toast from 'react-hot-toast'
import { STORAGE_KEYS } from '../../store/authTypes'

// Admin Auth Check Hook
const useAdminAuth = () => {
  const navigate = useNavigate()
  const { isAdminAuthenticated, isLoading, initializeAdminAuth } = useAdminAuthStore()
  
  useEffect(() => {
    initializeAdminAuth()
    if (!isLoading && !isAdminAuthenticated) {
      navigate('/admin/login')
    }
  }, [navigate, isAdminAuthenticated, isLoading, initializeAdminAuth])
  
  return isAdminAuthenticated
}

// Complete Product Management Component
const ProductManagement = () => {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { adminToken } = useAdminAuthStore()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/admin/products', {
        headers: {
          Authorization: `Bearer ${adminToken || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || ''}`
        }
      })
      setProducts(response.data.products || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    try {
      await apiClient.delete(`/admin/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${adminToken || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || ''}`
        }
      })
      setProducts(products.filter(p => p._id !== productId))
      toast.success('Product deleted successfully')
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Delete product error:', error)
      toast.error('Failed to delete product')
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    
    const formData = new FormData(e.target)
    const updatedData = {
      name: formData.get('name'),
      price: parseFloat(formData.get('price')),
      stock: parseInt(formData.get('stock')),
      status: formData.get('status'),
      description: formData.get('description'),
      category: formData.get('category')
    }

    try {
      const response = await apiClient.put(`/admin/products/${editingProduct._id}`, updatedData, {
        headers: {
          Authorization: `Bearer ${adminToken || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || ''}`
        }
      })
      
      // Update the products list with the updated product
      setProducts(products.map(p => 
        p._id === editingProduct._id ? response.data.product : p
      ))
      
      toast.success('Product updated successfully')
      setEditingProduct(null)
    } catch (error) {
      console.error('Update product error:', error)
      toast.error('Failed to update product')
    }
  }

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      await apiClient.put(`/admin/products/${productId}`, { 
        status: currentStatus === 'active' ? 'inactive' : 'active' 
      }, {
        headers: {
          Authorization: `Bearer ${adminToken || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || ''}`
        }
      })
      setProducts(products.map(p => 
        p._id === productId 
          ? { ...p, status: currentStatus === 'active' ? 'inactive' : 'active' }
          : p
      ))
      toast.success('Product status updated')
    } catch (error) {
      toast.error('Failed to update product status')
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product Management</h2>
        <Link to="/admin/add-product">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
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
                  Seller
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
                      <div className="h-10 w-10 flex-shrink-0">
                        {product.images?.[0] ? (
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={getImageUrl(product.images[0].url)}
                            alt={product.name}
                            onError={createImageErrorHandler('Product', 40, 40)}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
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
                    <button
                      onClick={() => handleToggleStatus(product._id, product.status)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}
                    >
                      {product.status || 'active'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.seller?.businessName || 'Admin'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => handleEditProduct(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => setDeleteConfirm(product)}
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

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Product: {editingProduct.name}
              </h3>
              <Button variant="outline" onClick={() => setEditingProduct(null)}>
                Close
              </Button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingProduct.name}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingProduct.description}
                  rows="3"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    defaultValue={editingProduct.price}
                    min="0"
                    step="0.01"
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    defaultValue={editingProduct.stock}
                    min="0"
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={editingProduct.category}
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingProduct.status}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-4 pt-4">
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Product
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <Button
                variant="danger"
                onClick={() => handleDeleteProduct(deleteConfirm._id)}
              >
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// Order Management Component
const OrderManagement = () => {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/admin/orders')
      setOrders(response.data.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const generateOrderId = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `ORD-${timestamp}-${random}`
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      await apiClient.put(`/admin/orders/${orderId}`, { status })
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status } : order
      ))
      toast.success('Order status updated')
    } catch (error) {
      toast.error('Failed to update order status')
    }
  }

  const generatePDF = (order) => {
    // Create PDF content
    const pdfContent = `
      ORDER INVOICE
      =============
      
      Order ID: ${order.orderNumber || generateOrderId()}
      Date: ${new Date(order.createdAt).toLocaleDateString()}
      Status: ${order.status}
      
      CUSTOMER DETAILS:
      Name: ${order.user?.displayName || 'N/A'}
      Email: ${order.user?.email || 'N/A'}
      Phone: ${order.user?.phoneNumber || 'N/A'}
      
      SHIPPING ADDRESS:
      ${order.shippingAddress?.street || 'N/A'}
      ${order.shippingAddress?.city || 'N/A'}, ${order.shippingAddress?.state || 'N/A'}
      ${order.shippingAddress?.zipCode || 'N/A'}
      
      ORDERED PRODUCTS:
      ${order.items?.map(item => 
        `- ${item.product?.name || 'Product'} x${item.quantity} - ₹${item.price * item.quantity}`
      ).join('\n') || 'No items'}
      
      TOTAL: ₹${order.total || 0}
    `
    
    // Create and download PDF
    const blob = new Blob([pdfContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `order-${order.orderNumber || generateOrderId()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Order details downloaded')
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Management</h2>
        <Button onClick={fetchOrders}>Refresh Orders</Button>
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
                  Total
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
                    {order.orderNumber || generateOrderId()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div>
                      <div className="font-medium">{order.user?.displayName || 'N/A'}</div>
                      <div className="text-xs">{order.user?.email || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <Price amount={order.total || 0} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status || 'pending'}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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
                      onClick={() => generatePDF(order)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                Order Details
              </h3>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Customer Information</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Name: {selectedOrder.user?.displayName || 'N/A'}<br />
                  Email: {selectedOrder.user?.email || 'N/A'}<br />
                  Phone: {selectedOrder.user?.phoneNumber || 'N/A'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Shipping Address</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedOrder.shippingAddress?.street || 'N/A'}<br />
                  {selectedOrder.shippingAddress?.city || 'N/A'}, {selectedOrder.shippingAddress?.state || 'N/A'}<br />
                  {selectedOrder.shippingAddress?.zipCode || 'N/A'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.product?.name || 'Product'} x{item.quantity}</span>
                      <Price amount={item.price * item.quantity} />
                    </div>
                  )) || <p className="text-sm text-gray-500">No items</p>}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <Price amount={selectedOrder.total || 0} />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

// Customer Management Component
const CustomersManagement = () => {
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { adminToken } = useAdminAuthStore()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/admin/customers', {
        headers: {
          Authorization: `Bearer ${adminToken || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || ''}`
        }
      })
      setCustomers(response.data.customers || [])
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleCustomerStatus = async (customerId, currentStatus) => {
    try {
      await apiClient.put(`/admin/customers/${customerId}`, {
        status: currentStatus === 'active' ? 'blocked' : 'active'
      }, {
        headers: {
          Authorization: `Bearer ${adminToken || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || ''}`
        }
      })
      setCustomers(customers.map(c => 
        c._id === customerId 
          ? { ...c, status: currentStatus === 'active' ? 'blocked' : 'active' }
          : c
      ))
      toast.success('Customer status updated')
    } catch (error) {
      toast.error('Failed to update customer status')
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Management</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Spent
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
              {customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {customer.photoURL ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={customer.photoURL}
                            alt={customer.displayName}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.displayName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Joined {new Date(customer.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {customer.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {customer.orderCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <Price amount={customer.totalSpent || 0} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {customer.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Button
                      size="small"
                      variant={customer.status === 'active' ? 'danger' : 'primary'}
                      onClick={() => handleToggleCustomerStatus(customer._id, customer.status)}
                    >
                      {customer.status === 'active' ? 'Block' : 'Unblock'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
// Enhanced Seller Management Component
const SellerManagement = () => {
  const [sellers, setSellers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [showApproveModal, setShowApproveModal] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const { adminToken } = useAdminAuthStore()

  useEffect(() => {
    fetchSellers()
  }, [])

  const fetchSellers = async () => {
    try {
      const response = await apiClient.get('/admin/sellers', {
        headers: {
          Authorization: `Bearer ${adminToken || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || ''}`
        }
      })
      setSellers(response.data.sellers || [])
    } catch (error) {
      console.error('Failed to fetch sellers:', error)
      toast.error('Failed to load sellers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveSeller = async (sellerId) => {
    try {
      const response = await apiClient.put(`/admin/sellers/${sellerId}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${adminToken || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || ''}`
        }
      })
      setSellers(sellers.map(s => 
        s._id === sellerId ? { ...s, status: 'approved' } : s
      ))
      toast.success('Seller approved successfully! Email sent with login credentials.')
      setShowApproveModal(null)
    } catch (error) {
      console.error('Approve seller error:', error)
      toast.error('Failed to approve seller')
    }
  }

  const handleRejectSeller = async (sellerId) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      await apiClient.put(`/admin/sellers/${sellerId}/reject`, {
        reason: rejectReason
      }, {
        headers: {
          Authorization: `Bearer ${adminToken || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || ''}`
        }
      })
      setSellers(sellers.map(s => 
        s._id === sellerId ? { ...s, status: 'rejected' } : s
      ))
      toast.success('Seller rejected successfully! Email sent with reason.')
      setShowRejectModal(null)
      setRejectReason('')
    } catch (error) {
      console.error('Reject seller error:', error)
      toast.error('Failed to reject seller')
    }
  }

  const handleDeleteSeller = async (sellerId) => {
    const seller = showDeleteModal
    const expectedText = `DELETE ${seller.businessName}`
    
    if (deleteConfirmText !== expectedText) {
      toast.error(`Please type "${expectedText}" to confirm deletion`)
      return
    }

    try {
      const response = await apiClient.delete(`/admin/sellers/${sellerId}`)
      
      // Remove seller from list
      setSellers(sellers.filter(s => s._id !== sellerId))
      
      toast.success(`Seller "${seller.businessName}" deleted successfully. ${response.data.deletedSeller.productsDeactivated} products deactivated.`)
      setShowDeleteModal(null)
      setDeleteConfirmText('')
    } catch (error) {
      console.error('Delete seller error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete seller')
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Management</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sellers..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onChange={(e) => {
                // Add search functionality here if needed
                console.log('Search:', e.target.value)
              }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <Button onClick={fetchSellers}>Refresh Sellers</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  GST Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Products
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
              {sellers.map((seller) => (
                <motion.tr
                  key={seller._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {seller.businessName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {seller.businessType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {seller.ownerName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {seller.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs">
                      {seller.businessAddress ? (
                        <>
                          {seller.businessAddress.city && (
                            <div>{seller.businessAddress.city}</div>
                          )}
                          {seller.businessAddress.state && (
                            <div className="text-gray-500 dark:text-gray-400">{seller.businessAddress.state}</div>
                          )}
                          {seller.businessAddress.pincode && (
                            <div className="text-xs text-gray-400">{seller.businessAddress.pincode}</div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 italic text-xs">No address</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {seller.gstNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {seller.productCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      seller.status === 'approved'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : seller.status === 'rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {seller.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => setSelectedSeller(seller)}
                    >
                      View Details
                    </Button>
                    {seller.status === 'pending' && (
                      <>
                        <Button
                          size="small"
                          variant="primary"
                          onClick={() => setShowApproveModal(seller)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="danger"
                          onClick={() => setShowRejectModal(seller)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {(seller.status === 'approved' || seller.status === 'rejected') && (
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => setShowDeleteModal(seller)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seller Details Modal */}
      {selectedSeller && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSeller(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Seller Details
              </h3>
              <Button variant="outline" onClick={() => setSelectedSeller(null)}>
                Close
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Business Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedSeller.businessName}</div>
                    <div><span className="font-medium">Type:</span> {selectedSeller.businessType}</div>
                    <div><span className="font-medium">GST:</span> {selectedSeller.gstNumber}</div>
                    <div><span className="font-medium">PAN:</span> {selectedSeller.panNumber}</div>
                    {selectedSeller.website && (
                      <div><span className="font-medium">Website:</span> 
                        <a href={selectedSeller.website} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:text-blue-800 ml-1">
                          {selectedSeller.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Owner Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedSeller.ownerName}</div>
                    <div><span className="font-medium">Email:</span> {selectedSeller.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedSeller.phone}</div>
                    {selectedSeller.alternatePhone && (
                      <div><span className="font-medium">Alt Phone:</span> {selectedSeller.alternatePhone}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Business Address</h4>
                <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {selectedSeller.businessAddress ? (
                    <>
                      {selectedSeller.businessAddress.street && (
                        <div className="mb-1">{selectedSeller.businessAddress.street}</div>
                      )}
                      <div className="mb-1">
                        {selectedSeller.businessAddress.city}
                        {selectedSeller.businessAddress.state && `, ${selectedSeller.businessAddress.state}`}
                      </div>
                      {selectedSeller.businessAddress.pincode && (
                        <div className="mb-1">PIN: {selectedSeller.businessAddress.pincode}</div>
                      )}
                      {selectedSeller.businessAddress.country && (
                        <div>{selectedSeller.businessAddress.country}</div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-400 italic">No address provided</div>
                  )}
                </div>
              </div>

              {selectedSeller.bankDetails && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Bank Details</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {selectedSeller.bankDetails.accountHolderName && (
                      <div className="mb-1"><span className="font-medium">Account Holder:</span> {selectedSeller.bankDetails.accountHolderName}</div>
                    )}
                    {selectedSeller.bankDetails.accountNumber && (
                      <div className="mb-1"><span className="font-medium">Account Number:</span> ****{selectedSeller.bankDetails.accountNumber.slice(-4)}</div>
                    )}
                    {selectedSeller.bankDetails.ifscCode && (
                      <div className="mb-1"><span className="font-medium">IFSC Code:</span> {selectedSeller.bankDetails.ifscCode}</div>
                    )}
                    {selectedSeller.bankDetails.bankName && (
                      <div className="mb-1"><span className="font-medium">Bank:</span> {selectedSeller.bankDetails.bankName}</div>
                    )}
                    {selectedSeller.bankDetails.branch && (
                      <div><span className="font-medium">Branch:</span> {selectedSeller.bankDetails.branch}</div>
                    )}
                  </div>
                </div>
              )}

              {selectedSeller.businessDescription && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Business Description</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {selectedSeller.businessDescription}
                  </div>
                </div>
              )}

              {selectedSeller.categories && selectedSeller.categories.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeller.categories.map((category, index) => (
                      <span key={index} className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 text-sm rounded-full">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Application Date</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(selectedSeller.applicationDate || selectedSeller.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                {selectedSeller.approvalDate && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Approval Date</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {new Date(selectedSeller.approvalDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Status</div>
                  <div className="text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedSeller.status === 'approved'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : selectedSeller.status === 'rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {selectedSeller.status}
                    </span>
                  </div>
                </div>
              </div>

              {selectedSeller.rejectionReason && (
                <div>
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-3">Rejection Reason</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    {selectedSeller.rejectionReason}
                  </div>
                </div>
              )}

              {selectedSeller.status === 'pending' && (
                <div className="flex space-x-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSelectedSeller(null)
                      setShowApproveModal(selectedSeller)
                    }}
                  >
                    Approve Seller
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setSelectedSeller(null)
                      setShowRejectModal(selectedSeller)
                    }}
                  >
                    Reject Seller
                  </Button>
                </div>
              )}

              {(selectedSeller.status === 'approved' || selectedSeller.status === 'rejected') && (
                <div className="flex space-x-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <Button
                    variant="danger"
                    onClick={() => {
                      setSelectedSeller(null)
                      setShowDeleteModal(selectedSeller)
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Seller Account
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Approve Seller
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to approve "{showApproveModal.businessName}"? 
              The seller will receive an email with login credentials.
            </p>
            <div className="flex space-x-4">
              <Button
                variant="primary"
                onClick={() => handleApproveSeller(showApproveModal._id)}
              >
                Approve & Send Email
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowApproveModal(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reject Seller
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for rejecting "{showRejectModal.businessName}":
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="flex space-x-4 mt-6">
              <Button
                variant="danger"
                onClick={() => handleRejectSeller(showRejectModal._id)}
              >
                Reject & Send Email
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectReason('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-red-600 dark:text-red-400">
                Delete Seller Account
              </h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                ⚠️ <strong>This action cannot be undone!</strong>
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Deleting "{showDeleteModal.businessName}" will:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 mb-4">
                <li>Permanently delete the seller account</li>
                <li>Deactivate all their products</li>
                <li>Preserve order history for records</li>
                <li>Send a deletion notification email</li>
              </ul>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                  Type <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">DELETE {showDeleteModal.businessName}</code> to confirm:
                </p>
              </div>
              
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={`Type: DELETE ${showDeleteModal.businessName}`}
              />
            </div>
            
            <div className="flex space-x-4">
              <Button
                variant="danger"
                onClick={() => handleDeleteSeller(showDeleteModal._id)}
                disabled={deleteConfirmText !== `DELETE ${showDeleteModal.businessName}`}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Delete Permanently
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(null)
                  setDeleteConfirmText('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Dashboard Overview Component
const DashboardOverview = ({ stats }) => {
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
      value: `₹${(stats.overview?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Total Orders',
      value: stats.overview?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Total Products',
      value: stats.overview?.totalProducts || 0,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Total Users',
      value: stats.overview?.totalUsers || 0,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <div className="flex space-x-4">
          <Link to="/admin/add-product">
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Orders</h3>
          {stats.orders?.recent && stats.orders.recent.length > 0 ? (
            <div className="space-y-4">
              {stats.orders?.recent?.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.user?.displayName || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <Price amount={order.total} />
                    <p className={`text-sm capitalize ${
                      order.status === 'completed' ? 'text-green-600' :
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Products</h3>
          {stats.products?.topSelling && stats.products.topSelling.length > 0 ? (
            <div className="space-y-4">
              {stats.products?.topSelling?.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg">
                      {product.images && product.images[0] ? (
                        <img
                          src={getImageUrl(product.images[0].url)}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={createImageErrorHandler('Product', 40, 40)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          <Package className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <Price amount={product.price} size="sm" className="text-gray-600 dark:text-gray-400" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{product.salesCount} sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No sales data available</p>
          )}
        </div>
      </div>
    </div>
  )
}
// Main Admin Dashboard Component
const AdminDashboard = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { admin, adminLogout, adminToken } = useAdminAuthStore()
  const [stats, setStats] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const isAuthenticated = useAdminAuth()

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats()
    }
  }, [isAuthenticated])

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/stats', {
        headers: {
          Authorization: `Bearer ${adminToken || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || ''}`
        }
      })
      setStats(response.data.stats || {})
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Set empty stats to prevent errors
      setStats({
        overview: {
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: 0,
          totalUsers: 0
        },
        orders: { recent: [] },
        products: { topSelling: [] }
      })
    } finally {
      setDashboardLoading(false)
    }
  }

  const handleLogout = () => {
    adminLogout()
    toast.success('Logged out successfully')
    navigate('/admin/login')
  }

  if (!isAuthenticated) {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Sellers', href: '/admin/sellers', icon: Store },
  ]

  const isActivePath = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  if (dashboardLoading) {
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Welcome, {admin?.username}
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
                Admin Dashboard
              </h1>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto p-4 lg:p-8">
            <Routes>
              <Route path="/" element={<DashboardOverview stats={stats} />} />
              <Route path="/products" element={<ProductManagement />} />
              <Route path="/add-product" element={<AddProduct />} />
              <Route path="/orders" element={<OrderManagement />} />
              <Route path="/reviews" element={<ReviewsManagement />} />
              <Route path="/customers" element={<CustomersManagement />} />
              <Route path="/sellers" element={<SellerManagement />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
