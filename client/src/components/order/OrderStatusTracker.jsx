import React from 'react'
import { 
  Package, 
  CreditCard, 
  CheckCircle, 
  Truck, 
  MapPin,
  Clock,
  XCircle
} from 'lucide-react'

const OrderStatusTracker = ({ order }) => {
  // Define order status steps with Amazon-style progression
  const statusSteps = [
    {
      key: 'pending',
      label: 'Order Placed',
      description: 'We have received your order',
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200'
    },
    {
      key: 'confirmed',
      label: 'Order Confirmed',
      description: 'Your order has been confirmed',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200'
    },
    {
      key: 'processing',
      label: 'Preparing for Shipment',
      description: 'Your order is being prepared',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200'
    },
    {
      key: 'shipped',
      label: 'Shipped',
      description: 'Your order is on the way',
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200'
    },
    {
      key: 'delivered',
      label: 'Delivered',
      description: 'Your order has been delivered',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200'
    }
  ]

  // Handle cancelled orders
  if (order.status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900">Order Cancelled</h3>
            <p className="text-red-700">This order has been cancelled.</p>
            {order.statusHistory && order.statusHistory.length > 0 && (
              <p className="text-sm text-red-600 mt-1">
                Cancelled on {new Date(order.statusHistory.find(h => h.status === 'cancelled')?.timestamp).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Get current status index
  const currentStatusIndex = statusSteps.findIndex(step => step.key === order.status)
  
  // Get status history with timestamps
  const getStatusTimestamp = (statusKey) => {
    if (!order.statusHistory || order.statusHistory.length === 0) return null
    const historyItem = order.statusHistory.find(h => h.status === statusKey)
    return historyItem ? new Date(historyItem.timestamp) : null
  }

  // Get estimated delivery date
  const getEstimatedDelivery = () => {
    if (order.shippingInfo?.estimatedDelivery) {
      return new Date(order.shippingInfo.estimatedDelivery)
    }
    // If no estimated delivery, calculate based on order date
    const orderDate = new Date(order.createdAt)
    const estimatedDate = new Date(orderDate)
    estimatedDate.setDate(orderDate.getDate() + 7) // Add 7 days
    return estimatedDate
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Status</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Order #</span>
          <span className="font-medium text-gray-900">{order.orderNumber}</span>
          <span className="text-sm text-gray-600">•</span>
          <span className="text-sm text-gray-600">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Status Progress */}
      <div className="relative">
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentStatusIndex
          const isCurrent = index === currentStatusIndex
          const timestamp = getStatusTimestamp(step.key)
          const Icon = step.icon

          return (
            <div key={step.key} className="relative flex items-start pb-8 last:pb-0">
              {/* Connector Line */}
              {index < statusSteps.length - 1 && (
                <div 
                  className={`absolute left-4 top-8 w-0.5 h-16 ${
                    isCompleted ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                />
              )}
              
              {/* Status Icon */}
              <div className="relative flex items-center justify-center">
                <div 
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-100 border-green-400' 
                      : isCurrent 
                        ? `${step.bgColor} ${step.borderColor}` 
                        : 'bg-gray-100 border-gray-300'
                  }`}
                >
                  <Icon 
                    className={`h-4 w-4 ${
                      isCompleted 
                        ? 'text-green-600' 
                        : isCurrent 
                          ? step.color 
                          : 'text-gray-400'
                    }`} 
                  />
                </div>
              </div>

              {/* Status Content */}
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-sm font-medium ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </h4>
                    <p className={`text-sm ${
                      isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Timestamp */}
                  {timestamp && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {timestamp.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {timestamp.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Info for Shipped Status */}
                {step.key === 'shipped' && isCompleted && order.shippingInfo?.trackingNumber && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Tracking Information</p>
                        <p className="text-sm text-blue-700">
                          Carrier: {order.shippingInfo.carrier || 'Standard Shipping'}
                        </p>
                        <p className="text-sm text-blue-700">
                          Tracking #: {order.shippingInfo.trackingNumber}
                        </p>
                      </div>
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Track Package
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Estimated Delivery */}
      {order.status !== 'delivered' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Estimated Delivery: {getEstimatedDelivery().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      )}

      {/* Delivered Info */}
      {order.status === 'delivered' && order.shippingInfo?.deliveredAt && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Delivered on {new Date(order.shippingInfo.deliveredAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderStatusTracker