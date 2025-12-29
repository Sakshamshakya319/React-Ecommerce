import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, LogIn } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { useUserAuthStore } from '../store/userAuthStore'
import { useCurrencyStore } from '../store/currencyStore'
import { useLanguageStore } from '../store/languageStore'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Price from '../components/ui/Price'
import ProductImage from '../components/ui/ProductImage'
import CurrencySelector from '../components/ui/CurrencySelector'
import toast from 'react-hot-toast'

const Cart = () => {
  const navigate = useNavigate()
  const { items, total, isLoading, updateQuantity, removeFromCart, clearCart, calculateTotal } = useCartStore()
  const { isUserAuthenticated, user } = useUserAuthStore()
  const { formatPrice, convertPrice } = useCurrencyStore()
  const { t } = useLanguageStore()

  // Recalculate total when component mounts
  useEffect(() => {
    calculateTotal()
  }, [calculateTotal])

  const getItemPrice = (item) => {
    return parseFloat(item.variant?.price || item.product?.price || 0)
  }

  const getItemTotal = (item) => {
    const price = getItemPrice(item)
    const quantity = parseInt(item.quantity) || 0
    return price * quantity
  }

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + getItemTotal(item), 0)
  }

  const getShippingCost = () => {
    const subtotal = getSubtotal()
    return subtotal >= 500 ? 0 : 99 // Free shipping over ₹500, otherwise ₹99
  }

  const getTaxAmount = () => {
    const subtotal = getSubtotal()
    return subtotal * 0.18 // 18% GST in India
  }

  const getFinalTotal = () => {
    return getSubtotal() + getShippingCost() + getTaxAmount()
  }

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId)
      return
    }
    updateQuantity(itemId, newQuantity)
  }

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId)
  }

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart()
    }
  }

  const handleCheckout = () => {
    navigate('/checkout')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  // Show login prompt for unauthenticated users
  if (!isUserAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-8">
              <LogIn className="h-12 w-12 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Login Required</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Please log in to view your cart and continue shopping.
            </p>
            <div className="space-y-4">
              <Link to="/login" state={{ from: { pathname: '/cart' } }}>
                <Button size="large" className="mr-4">
                  <LogIn className="h-5 w-5 mr-2" />
                  Login to Continue
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="large">
                  Create Account
                </Button>
              </Link>
            </div>
            <div className="mt-8">
              <Link to="/products" className="text-primary-600 hover:text-primary-700">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link to="/products">
              <Button variant="primary" size="large">
                Continue Shopping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <CurrencySelector />
          </div>
          <Button
            variant="outline"
            onClick={handleClearCart}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  {/* Product Image */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                    <ProductImage 
                      product={item.product}
                      containerClassName="w-full h-full bg-gray-200 rounded-lg"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product._id}`}
                      className="text-base sm:text-lg font-semibold text-gray-900 hover:text-primary-600 truncate block"
                    >
                      {item.product.name}
                    </Link>
                    
                    {/* Variant Info */}
                    {item.variant && (
                      <div className="flex items-center space-x-4 mt-1">
                        {item.variant.color && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Color:</span>
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: item.variant.color }}
                            ></div>
                          </div>
                        )}
                        {item.variant.material && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Material:</span>
                            <span className="text-sm font-medium capitalize">
                              {item.variant.material}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="p-1 rounded-md hover:bg-gray-100"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-1 rounded-md hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Price and Remove */}
                      <div className="flex items-center space-x-4">
                        <Price 
                          amount={getItemTotal(item)} 
                          size="lg"
                          className="text-primary-600"
                          showOriginal={true}
                        />
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                    Subtotal ({items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)} items)
                  </span>
                  <Price amount={getSubtotal()} />
                </div>
                
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {getShippingCost() === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      <Price amount={getShippingCost()} />
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Tax (GST 18%)</span>
                  <Price amount={getTaxAmount()} />
                </div>
                
                <hr className="my-4" />
                
                <div className="flex justify-between text-lg sm:text-xl font-semibold">
                  <span>Total</span>
                  <Price 
                    amount={getFinalTotal()} 
                    size="lg"
                    className="text-primary-600"
                  />
                </div>
              </div>

              {/* Shipping Notice */}
              {getShippingCost() > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-blue-800">
                    Add <Price amount={500 - getSubtotal()} className="inline font-semibold" /> more for free shipping!
                  </p>
                </div>
              )}

              {/* Checkout Button */}
              <Button
                variant="primary"
                size="large"
                onClick={handleCheckout}
                className="w-full mb-4"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              {/* Continue Shopping */}
              <Link to="/products">
                <Button variant="outline" size="large" className="w-full">
                  Continue Shopping
                </Button>
              </Link>

              {/* Security Notice */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  🔒 Secure checkout with SSL encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart