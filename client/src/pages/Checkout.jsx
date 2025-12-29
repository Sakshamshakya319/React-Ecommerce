import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, MapPin, Package, CheckCircle } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { useUserAuthStore } from '../store/userAuthStore'
import { apiClient } from '../api/client'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Price from '../components/ui/Price'
import ProductImage from '../components/ui/ProductImage'
import CheckoutAddressForm from '../components/checkout/CheckoutAddressForm'
import toast from 'react-hot-toast'

const Checkout = () => {
  const navigate = useNavigate()
  const { items, total, clearCart, syncCartPrices } = useCartStore()
  const { user, isUserAuthenticated } = useUserAuthStore()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [orderData, setOrderData] = useState({
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    payment: {
      method: 'credit_card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    },
    useBillingForShipping: true
  })

  useEffect(() => {
    if (!isUserAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } })
      return
    }
    
    if (items.length === 0) {
      navigate('/cart')
      return
    }

    // Sync cart prices with current product prices
    syncCartPrices()

    // Pre-fill with user's default address if available
    if (user?.addresses?.length > 0) {
      const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0]
      setOrderData(prev => ({
        ...prev,
        shippingAddress: {
          street: defaultAddress.street || '',
          city: defaultAddress.city || '',
          state: defaultAddress.state || '',
          zipCode: defaultAddress.zipCode || '',
          country: defaultAddress.country || 'India'
        }
      }))
    }
  }, [isUserAuthenticated, items.length, user, navigate, syncCartPrices])

  const handleInputChange = (section, field, value) => {
    setOrderData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleCheckboxChange = (field, checked) => {
    setOrderData(prev => ({
      ...prev,
      [field]: checked
    }))
    
    // Copy shipping address to billing if checkbox is checked
    if (field === 'useBillingForShipping' && checked) {
      setOrderData(prev => ({
        ...prev,
        billingAddress: { ...prev.shippingAddress }
      }))
    }
  }

  const validateStep = (step) => {
    switch (step) {
      case 1: // Shipping Address
        const { street, city, state, zipCode } = orderData.shippingAddress
        return street && city && state && zipCode
      case 2: // Payment
        const { cardNumber, expiryDate, cvv, cardholderName } = orderData.payment
        return cardNumber && expiryDate && cvv && cardholderName
      default:
        return true
    }
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    } else {
      toast.error('Please fill in all required fields')
    }
  }

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handlePlaceOrder = async () => {
    if (!validateStep(2)) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    
    try {
      console.log('=== PLACING ORDER ===')
      console.log('User authenticated:', isUserAuthenticated)
      console.log('User token exists:', !!localStorage.getItem('userToken'))
      console.log('Items count:', items.length)
      
      // Fetch current product prices and prepare order data
      const orderItems = []
      
      for (const item of items) {
        try {
          // Fetch current product data to get latest price
          const productResponse = await apiClient.get(`/products/${item.product._id}`)
          const currentProduct = productResponse.data.product
          
          // Use current price, not cached cart price
          let currentPrice = currentProduct.price
          if (item.variant && currentProduct.variants?.length > 0) {
            const productVariant = currentProduct.variants.find(v => 
              v.color === item.variant.color && v.material === item.variant.material
            )
            if (productVariant) {
              currentPrice = productVariant.price
            }
          }
          
          orderItems.push({
            product: item.product._id,
            name: currentProduct.name,
            quantity: item.quantity,
            price: currentPrice, // Use current price
            variant: item.variant,
            sku: currentProduct.sku,
            image: currentProduct.images?.[0]?.url || ''
          })
        } catch (productError) {
          console.error('Error fetching product:', productError)
          // Fallback to cart data if product fetch fails
          orderItems.push({
            product: item.product._id,
            name: item.product.name,
            quantity: item.quantity,
            price: getItemPrice(item),
            variant: item.variant,
            sku: item.product.sku,
            image: item.product.images?.[0]?.url || ''
          })
        }
      }
      
      // Prepare order data
      const order = {
        items: orderItems,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.useBillingForShipping 
          ? orderData.shippingAddress 
          : orderData.billingAddress,
        payment: {
          method: orderData.payment.method
        },
        notes: {
          customer: ''
        }
      }

      console.log('Order data:', order)

      // Create order
      const response = await apiClient.post('/orders', order)
      
      if (response.data.success) {
        // Clear cart
        clearCart()
        
        // Show success and redirect
        toast.success('Order placed successfully!')
        navigate(`/orders/${response.data.order._id}`, { 
          state: { orderCreated: true }
        })
      }
    } catch (error) {
      console.error('Order creation error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      if (error.response?.status === 401) {
        toast.error('Please log in to place an order')
        navigate('/login', { state: { from: { pathname: '/checkout' } } })
      } else {
        toast.error(error.response?.data?.message || 'Failed to place order')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Shipping', icon: MapPin },
    { number: 2, title: 'Payment', icon: CreditCard },
    { number: 3, title: 'Review', icon: Package }
  ]

  const getItemPrice = (item) => {
    return parseFloat(item.variant?.price || item.product?.price || item.price || 0)
  }

  const subtotal = items.reduce((sum, item) => sum + (getItemPrice(item) * item.quantity), 0)
  const tax = subtotal * 0.18 // 18% GST
  const shipping = subtotal >= 500 ? 0 : 99 // Free shipping over ₹500
  const orderTotal = subtotal + tax + shipping

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-6 sm:mb-8 overflow-x-auto">
          <div className="flex items-center space-x-4 sm:space-x-8 min-w-max px-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={`step-${step.number}`} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 
                    ${isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6" />
                    ) : (
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                  <span className={`ml-2 font-medium text-sm sm:text-base ${
                    isActive ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="ml-4 sm:ml-8 w-6 sm:w-8 h-0.5 bg-gray-300"></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              {/* Step 1: Shipping Address */}
              {currentStep === 1 && (
                <div>
                  <CheckoutAddressForm 
                    onAddressSubmit={(addressData) => {
                      setOrderData(prev => ({
                        ...prev,
                        shippingAddress: addressData.shippingAddress,
                        billingAddress: addressData.billingAddress
                      }))
                      handleNextStep()
                    }}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Payment Information
                  </h2>
                  
                  <div className="space-y-4">
                    <Input
                      label="Cardholder Name"
                      value={orderData.payment.cardholderName}
                      onChange={(e) => handleInputChange('payment', 'cardholderName', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                    
                    <Input
                      label="Card Number"
                      value={orderData.payment.cardNumber}
                      onChange={(e) => handleInputChange('payment', 'cardNumber', e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Expiry Date"
                        value={orderData.payment.expiryDate}
                        onChange={(e) => handleInputChange('payment', 'expiryDate', e.target.value)}
                        placeholder="MM/YY"
                        required
                      />
                      
                      <Input
                        label="CVV"
                        value={orderData.payment.cvv}
                        onChange={(e) => handleInputChange('payment', 'cvv', e.target.value)}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="mt-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={orderData.useBillingForShipping}
                        onChange={(e) => handleCheckboxChange('useBillingForShipping', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-gray-700">
                        Billing address same as shipping address
                      </span>
                    </label>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={handlePreviousStep}>
                      Back to Shipping
                    </Button>
                    <Button onClick={handleNextStep}>
                      Review Order
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Review Your Order
                  </h2>
                  
                  {/* Order Items */}
                  <div className="space-y-4 mb-6">
                    {items.map((item, index) => (
                      <div key={`${item.product._id}-${index}`} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                          <ProductImage 
                            product={item.product}
                            containerClassName="w-full h-full bg-gray-200 rounded-lg"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.product.name}</h3>
                          <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                          {item.variant && (
                            <p className="text-xs sm:text-sm text-gray-500">
                              {item.variant.color && `Color: ${item.variant.color}`}
                              {item.variant.material && `, Material: ${item.variant.material}`}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <Price amount={getItemPrice(item) * item.quantity} className="text-sm sm:text-base" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Addresses Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                      <div className="text-gray-600 text-sm">
                        {orderData.shippingAddress.street}<br />
                        {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.zipCode}
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
                      <div className="text-gray-600 text-sm">
                        Credit Card ending in {orderData.payment.cardNumber.slice(-4)}<br />
                        {orderData.payment.cardholderName}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handlePreviousStep}>
                      Back to Payment
                    </Button>
                    <Button 
                      onClick={handlePlaceOrder}
                      isLoading={isLoading}
                      disabled={isLoading}
                    >
                      Place Order
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">
                    Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)
                  </span>
                  <Price amount={subtotal} />
                </div>
                
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      <Price amount={shipping} />
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Tax (GST 18%)</span>
                  <Price amount={tax} />
                </div>
                
                <hr className="my-4" />
                
                <div className="flex justify-between text-lg sm:text-xl font-semibold">
                  <span>Total</span>
                  <Price amount={orderTotal} size="lg" className="text-primary-600" />
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 mb-4">
                🔒 Your payment information is secure and encrypted
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout