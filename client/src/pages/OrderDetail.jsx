import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Calendar, CreditCard, MapPin, Download, RefreshCw, Star, FileText } from 'lucide-react'
import { apiClient } from '../api/client'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Price from '../components/ui/Price'
import WriteReview from '../components/orders/WriteReview'
import OrderStatusTracker from '../components/order/OrderStatusTracker'
import toast from 'react-hot-toast'

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showWriteReview, setShowWriteReview] = useState(false)

  useEffect(() => {
    fetchOrderDetail()
  }, [id])

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get(`/orders/${id}`)
      
      if (response.data.success) {
        setOrder(response.data.order)
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error)
      toast.error('Failed to load order details')
      navigate('/orders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return
    }

    try {
      setIsCancelling(true)
      const response = await apiClient.put(`/orders/${id}/cancel`)
      
      if (response.data.success) {
        setOrder(response.data.order)
        toast.success('Order cancelled successfully')
      }
    } catch (error) {
      console.error('Failed to cancel order:', error)
      toast.error(error.response?.data?.message || 'Failed to cancel order')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      console.log('Downloading invoice for order:', id)
      
      const response = await apiClient.get(`/orders/${id}/invoice`, {
        responseType: 'blob',
        headers: {
          'Accept': 'text/plain'
        }
      })
      
      console.log('Invoice response received:', response.status)
      
      // Create blob URL and download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/plain' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${order.orderNumber || id}.txt`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Invoice downloaded successfully!')
    } catch (error) {
      console.error('Failed to download invoice:', error)
      
      // Handle different error types
      if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Invoice is not available for this order status')
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to download this invoice')
      } else if (error.response?.status === 404) {
        toast.error('Order not found')
      } else {
        toast.error('Failed to download invoice. Please try again.')
      }
    }
  }

  const handleDownloadPDFInvoice = async () => {
    try {
      console.log('Downloading PDF invoice for order:', id)
      
      const response = await apiClient.get(`/orders/${id}/pdf-invoice`, {
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
      link.setAttribute('download', `invoice-${order.orderNumber || id}.pdf`)
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

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      refunded: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <RefreshCw className="h-5 w-5" />
      case 'confirmed':
        return <CheckCircle className="h-5 w-5" />
      case 'processing':
        return <Package className="h-5 w-5" />
      case 'shipped':
        return <Truck className="h-5 w-5" />
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />
      case 'cancelled':
        return <XCircle className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const canCancelOrder = (status) => {
    return ['pending', 'confirmed'].includes(status)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
          <Button onClick={() => navigate('/orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/orders')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order #{order.orderNumber || order._id.slice(-8)}
                </h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Package className="h-4 w-4" />
                    <span>{order.items?.length || 0} items</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                <div className={`inline-flex items-center px-3 py-2 rounded-lg border ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-2 font-medium capitalize">{order.status}</span>
                </div>
                <Price amount={order.total} className="text-xl font-bold text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Status Tracker */}
            <OrderStatusTracker order={order} />
            
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Items</h2>
              
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.image}`}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full bg-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-xs" style={{ display: item.image ? 'none' : 'flex' }}>
                        <Package className="h-6 w-6" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>Quantity: {item.quantity}</span>
                        <span>Price: <Price amount={item.price} /></span>
                        {item.sku && <span>SKU: {item.sku}</span>}
                      </div>
                      {item.variant && (
                        <div className="text-sm text-gray-500 mt-1">
                          {item.variant.color && `Color: ${item.variant.color}`}
                          {item.variant.material && `, Material: ${item.variant.material}`}
                          {item.variant.size && `, Size: ${item.variant.size}`}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <Price amount={item.price * item.quantity} className="font-semibold" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Status History */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status History</h2>
                
                <div className="space-y-4">
                  {order.statusHistory.map((status, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(status.status)}`}>
                        {getStatusIcon(status.status)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium capitalize">{status.status}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(status.timestamp).toLocaleString()}
                        </div>
                        {status.note && (
                          <div className="text-sm text-gray-500 mt-1">{status.note}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <Price amount={order.subtotal} />
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <Price amount={order.tax} />
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  {order.shipping === 0 ? (
                    <span className="text-green-600 font-medium">Free</span>
                  ) : (
                    <Price amount={order.shipping} />
                  )}
                </div>
                
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-<Price amount={order.discount} /></span>
                  </div>
                )}
                
                <hr className="my-3" />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <Price amount={order.total} />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
              
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="text-gray-700">
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                  {order.shippingAddress.country}
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium capitalize">{order.payment.method.replace('_', ' ')}</div>
                  <div className={`text-sm ${
                    order.payment.status === 'completed' ? 'text-green-600' : 
                    order.payment.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    Status: {order.payment.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                {['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleDownloadPDFInvoice}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download PDF Invoice
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-sm"
                      onClick={handleDownloadInvoice}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Text Invoice
                    </Button>
                  </div>
                )}
                
                {order.status === 'delivered' && (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setShowWriteReview(true)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Write Review
                  </Button>
                )}
                
                {canCancelOrder(order.status) && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-600 hover:bg-red-50"
                    onClick={handleCancelOrder}
                    isLoading={isCancelling}
                    disabled={isCancelling}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                )}
                
                {order.shipping?.trackingNumber && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`/orders/${order._id}/track`, '_blank')}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Track Package
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Write Review Modal */}
      {showWriteReview && (
        <WriteReview
          orderId={order._id}
          onClose={() => setShowWriteReview(false)}
          onSuccess={() => {
            setShowWriteReview(false)
            toast.success('Thank you for your review!')
          }}
        />
      )}
    </div>
  )
}

export default OrderDetail