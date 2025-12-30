import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ShoppingCart, 
  Download, 
  Eye, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useSellerAuthStore } from '../../store/sellerAuthStore'
import { apiClient } from '../../api/client'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Price from '../../components/ui/Price'
import OrderStatusTracker from '../../components/order/OrderStatusTracker'
import toast from 'react-hot-toast'

const SellerOrders = () => {
  const navigate = useNavigate()
  const { isSellerAuthenticated, seller } = useSellerAuthStore()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!isSellerAuthenticated) {
      navigate('/seller/login')
      return
    }
    fetchOrders()
  }, [isSellerAuthenticated, statusFilter, currentPage])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })
      
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await apiClient.get(`/seller/orders?${params.toString()}`)
      
      if (response.data.success) {
        setOrders(response.data.orders || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus, shippingData = {}) => {
    try {
      const requestData = {
        status: newStatus,
        note: `Status updated to ${newStatus} by seller`,
        ...shippingData
      }
      
      const response = await apiClient.put(`/seller/orders/${orderId}/status`, requestData)
      
      if (response.data.success) {
        const updatedOrder = response.data.order
        
        // Update orders list
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
      toast.error('Failed to update order status')
      throw error
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'processing':
        return <Package className="h-4 w-4" />
      case 'shipped':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'confirmed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
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

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchOrders()
  }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Orders
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage and track orders containing your products
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button onClick={fetchOrders} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order number or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </form>

            {/* Status Filter */}
            <div className="flex items-center space-x-4">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
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
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {orders.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Order Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Your Items
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
                    {orders.map((order) => (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              #{order.orderNumber}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              <Price amount={order.sellerSubtotal || order.total || 0} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {order.user?.displayName || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {order.user?.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {order.sellerItemCount || order.items?.length || 0} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1">{order.status || 'pending'}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Manage
                          </Button>
                          <Button
                            size="small"
                            variant="primary"
                            onClick={() => downloadPDFInvoice(order)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Page <span className="font-medium">{currentPage}</span> of{' '}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No orders found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {statusFilter 
                  ? `No orders with status "${statusFilter}"` 
                  : 'You haven\'t received any orders yet.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Order Management Modal */}
        {selectedOrder && (
          <OrderManagementModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdate={(updatedOrder) => {
              setOrders(orders.map(order => 
                order._id === updatedOrder._id ? updatedOrder : order
              ))
              setSelectedOrder(updatedOrder)
            }}
            updateOrderStatus={updateOrderStatus}
          />
        )}
      </div>
    </div>
  )
}

// Order Management Modal Component
const OrderManagementModal = ({ order, onClose, onUpdate, updateOrderStatus }) => {
  const [activeTab, setActiveTab] = useState('details')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Order Management - #{order.orderNumber}
            </h3>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
          
          {/* Tabs */}
          <div className="mt-4">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Order Details
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'status'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Status Management
              </button>
              <button
                onClick={() => setActiveTab('tracking')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tracking'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Order Tracking
              </button>
            </nav>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {activeTab === 'details' && (
            <OrderDetailsTab order={order} downloadPDFInvoice={downloadPDFInvoice} />
          )}
          
          {activeTab === 'status' && (
            <StatusManagementTab 
              order={order} 
              onUpdate={onUpdate}
              updateOrderStatus={updateOrderStatus}
            />
          )}
          
          {activeTab === 'tracking' && (
            <OrderTrackingTab order={order} />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Order Details Tab
const OrderDetailsTab = ({ order, downloadPDFInvoice }) => (
  <div className="space-y-6">
    {/* Customer Information */}
    <div>
      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Customer Information</h4>
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {order.user?.displayName || 'N/A'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {order.user?.email || 'N/A'}
            </span>
          </div>
          {order.user?.phoneNumber && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {order.user.phoneNumber}
              </span>
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Customer ID: {order.user?.customerId || 'N/A'}
          </div>
        </div>
      </div>
    </div>

    {/* Shipping Address */}
    <div>
      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Shipping Address</h4>
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex items-start space-x-2">
          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {order.shippingAddress?.street || 'N/A'}<br />
            {order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.state || 'N/A'}<br />
            {order.shippingAddress?.zipCode || 'N/A'}, {order.shippingAddress?.country || 'N/A'}
          </div>
        </div>
      </div>
    </div>

    {/* Your Products */}
    <div>
      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Your Products in this Order</h4>
      <div className="space-y-2">
        {order.items?.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {item.product?.name || item.name || 'Product'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Quantity: {item.quantity} × <Price amount={item.price} />
              </div>
              {item.sku && (
                <div className="text-xs text-gray-400">SKU: {item.sku}</div>
              )}
            </div>
            <div className="text-right">
              <Price amount={item.price * item.quantity} className="font-semibold" />
            </div>
          </div>
        )) || <p className="text-sm text-gray-500">No items</p>}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-lg">
            <span>Your Total:</span>
            <Price amount={order.sellerSubtotal || order.total || 0} className="ml-2" />
          </div>
          <div className="space-x-2">
            <Button
              size="small"
              variant="primary"
              onClick={() => downloadPDFInvoice(order)}
            >
              <Download className="h-3 w-3 mr-1" />
              Download PDF Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Status Management Tab
const StatusManagementTab = ({ order, onUpdate, updateOrderStatus }) => {
  const [newStatus, setNewStatus] = useState(order.status)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async () => {
    if (newStatus === order.status) return
    
    setIsUpdating(true)
    try {
      const updatedOrder = await updateOrderStatus(order._id, newStatus)
      onUpdate(updatedOrder)
    } catch (error) {
      // Error handled in updateOrderStatus
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Current Status</h4>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
        </div>
      </div>

      {/* Update Status */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Update Status</h4>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <Button
            onClick={handleStatusUpdate}
            disabled={newStatus === order.status || isUpdating}
            isLoading={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </div>

      {/* Shipping Information Form */}
      {(newStatus === 'shipped' || order.status === 'shipped') && (
        <ShippingInfoForm 
          order={order}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}

// Order Tracking Tab
const OrderTrackingTab = ({ order }) => (
  <div className="space-y-6">
    <OrderStatusTracker order={order} />
    
    {order.shippingInfo && (
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Shipping Information</h4>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="space-y-2 text-sm">
            {order.shippingInfo.carrier && (
              <div><strong>Carrier:</strong> {order.shippingInfo.carrier}</div>
            )}
            {order.shippingInfo.trackingNumber && (
              <div><strong>Tracking Number:</strong> {order.shippingInfo.trackingNumber}</div>
            )}
            {order.shippingInfo.estimatedDelivery && (
              <div><strong>Estimated Delivery:</strong> {new Date(order.shippingInfo.estimatedDelivery).toLocaleDateString()}</div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
)

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
    <div>
      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Shipping Information</h4>
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  )
}

export default SellerOrders