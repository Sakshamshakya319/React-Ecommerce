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
import toast from 'react-hot-toast'

const SellerOrders = () => {
  const navigate = useNavigate()
  const { isSellerAuthenticated } = useSellerAuthStore()
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

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchOrders()
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      console.log('Updating order status:', { orderId, newStatus })
      
      const response = await apiClient.put(`/seller/orders/${orderId}/status`, {
        status: newStatus,
        note: `Status updated to ${newStatus} by seller`
      })
      
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
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error('Failed to update order status: ' + (error.response?.data?.message || error.message))
    }
  }

  if (isLoading && orders.length === 0) {
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
                        <div className="space-y-2">
                          {/* Status Badge */}
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">{order.status || 'pending'}</span>
                            </span>
                          </div>
                          
                          {/* Quick Status Update */}
                          <select
                            value={order.status || 'pending'}
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-1">
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
                          
                          {/* Quick Action Buttons */}
                          {order.status === 'pending' && (
                            <Button
                              size="small"
                              variant="success"
                              onClick={() => handleStatusUpdate(order._id, 'confirmed')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirm
                            </Button>
                          )}
                          
                          {order.status === 'confirmed' && (
                            <Button
                              size="small"
                              variant="warning"
                              onClick={() => handleStatusUpdate(order._id, 'processing')}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              <Package className="h-3 w-3 mr-1" />
                              Process
                            </Button>
                          )}
                          
                          {order.status === 'processing' && (
                            <Button
                              size="small"
                              variant="info"
                              onClick={() => handleStatusUpdate(order._id, 'shipped')}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Truck className="h-3 w-3 mr-1" />
                              Ship
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
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

        {/* Simple Order Details Modal */}
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
              className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Order Details - #{selectedOrder.orderNumber}
                  </h3>
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                    Close
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Customer Information</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm">
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{selectedOrder.user?.displayName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedOrder.user?.email || 'N/A'}</span>
                      </div>
                      {selectedOrder.user?.phoneNumber && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{selectedOrder.user.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Status Management */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Order Status Management</h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-4">
                      {/* Current Status Display */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Status:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                          {getStatusIcon(selectedOrder.status)}
                          <span className="ml-1 capitalize">{selectedOrder.status || 'pending'}</span>
                        </span>
                      </div>

                      {/* Status Update Dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Update Status:
                        </label>
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      {/* Shipping Information Form */}
                      {(selectedOrder.status === 'processing' || selectedOrder.status === 'shipped') && (
                        <div className="border-t border-blue-200 dark:border-blue-700 pt-4">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-3">Shipping Information</h5>
                          <ShippingInfoForm 
                            order={selectedOrder}
                            onUpdate={(updatedOrder) => {
                              setSelectedOrder(updatedOrder)
                              // Update the order in the orders list
                              setOrders(orders.map(order => 
                                order._id === updatedOrder._id ? updatedOrder : order
                              ))
                            }}
                          />
                        </div>
                      )}

                      {/* Display Existing Shipping Info */}
                      {selectedOrder.shippingInfo && (
                        <div className="border-t border-blue-200 dark:border-blue-700 pt-4">
                          <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Current Shipping Details</h5>
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

                  {/* Shipping Address */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Shipping Address</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          {selectedOrder.shippingAddress?.street || 'N/A'}<br />
                          {selectedOrder.shippingAddress?.city || 'N/A'}, {selectedOrder.shippingAddress?.state || 'N/A'}<br />
                          {selectedOrder.shippingAddress?.zipCode || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Your Products</h4>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.product?.name || item.name || 'Product'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Quantity: {item.quantity} × <Price amount={item.price} />
                            </div>
                          </div>
                          <div className="text-right">
                            <Price amount={item.price * item.quantity} className="font-semibold" />
                          </div>
                        </div>
                      )) || <p className="text-sm text-gray-500">No items</p>}
                    </div>
                  </div>

                  {/* Total and Actions */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-lg">
                        <span>Your Total: </span>
                        <Price amount={selectedOrder.sellerSubtotal || selectedOrder.total || 0} />
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => downloadPDFInvoice(selectedOrder)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
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
    <div className="space-y-3">
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

export default SellerOrders