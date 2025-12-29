import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2, Star, ArrowRight } from 'lucide-react'
import { useUserAuthStore } from '../store/userAuthStore'
import { useCartStore } from '../store/cartStore'
import { useLanguageStore } from '../store/languageStore'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Price from '../components/ui/Price'
import Image from '../components/ui/Image'
import toast from 'react-hot-toast'

const Wishlist = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  
  const { 
    user, 
    isUserAuthenticated, 
    fetchWishlist, 
    removeFromWishlist 
  } = useUserAuthStore()
  
  const { addToCart } = useCartStore()
  const { t } = useLanguageStore()

  useEffect(() => {
    if (!isUserAuthenticated) {
      navigate('/login')
      return
    }
    
    const loadWishlist = async () => {
      try {
        await fetchWishlist()
      } catch (error) {
        console.error('Failed to load wishlist:', error)
        toast.error('Failed to load wishlist')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadWishlist()
  }, [isUserAuthenticated, navigate, fetchWishlist])

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await removeFromWishlist(productId)
      toast.success('Removed from wishlist')
    } catch (error) {
      toast.error('Failed to remove from wishlist')
    }
  }

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product, 1)
      toast.success('Added to cart!')
    } catch (error) {
      toast.error('Failed to add to cart')
    }
  }

  const handleMoveToCart = async (product) => {
    try {
      await addToCart(product, 1)
      await removeFromWishlist(product._id)
      toast.success('Moved to cart!')
    } catch (error) {
      toast.error('Failed to move to cart')
    }
  }

  if (!isUserAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  const wishlistItems = user?.wishlist || []

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Heart className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Save items you love for later. Start browsing and add products to your wishlist.
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Wishlist</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          <Link to="/products">
            <Button variant="outline">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Wishlist Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((product) => (
            <div
              key={product._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Product Image */}
              <div className="relative aspect-square">
                <Link to={`/products/${product._id}`}>
                  <Image
                    src={product.images?.[0]?.url}
                    alt={product.name}
                    fallbackText={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                
                {/* Remove from Wishlist Button */}
                <button
                  onClick={() => handleRemoveFromWishlist(product._id)}
                  className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Heart className="h-4 w-4 text-red-500 fill-current" />
                </button>

                {/* Discount Badge */}
                {product.discount > 0 && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                    -{product.discount}%
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="mb-3">
                  <Link
                    to={`/products/${product._id}`}
                    className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2 transition-colors"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {product.category}
                  </p>
                </div>

                {/* Rating */}
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(product.rating?.average || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                    ({product.rating?.count || 0})
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-2 mb-4">
                  <Price 
                    amount={product.price} 
                    className="text-primary-600 dark:text-primary-400 font-bold"
                    showOriginal={false}
                  />
                  {product.originalPrice && product.originalPrice > product.price && (
                    <Price 
                      amount={product.originalPrice}
                      size="sm"
                      className="text-gray-500 dark:text-gray-400 line-through"
                    />
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => handleMoveToCart(product)}
                    disabled={product.stock === 0}
                    className="w-full"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.stock === 0 ? 'Out of Stock' : 'Move to Cart'}
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Link to={`/products/${product._id}`} className="flex-1">
                      <Button variant="outline" size="small" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleRemoveFromWishlist(product._id)}
                      className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="text-center mt-12">
          <Link to="/products">
            <Button variant="outline" size="large">
              Continue Shopping
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Wishlist