import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, ShoppingCart, Heart, Share2, ArrowLeft, Truck, Shield, RotateCcw } from 'lucide-react'
import { useProductStore } from '../store/productStore'
import { useCartStore } from '../store/cartStore'
import { useUserAuthStore } from '../store/userAuthStore'
import { useCurrencyStore } from '../store/currencyStore'
import { useLanguageStore } from '../store/languageStore'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Price from '../components/ui/Price'
import ReviewForm from '../components/products/ReviewForm'
import SimpleWriteReview from '../components/orders/SimpleWriteReview'
import toast from 'react-hot-toast'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showSimpleReview, setShowSimpleReview] = useState(false)

  const { currentProduct, isLoading, fetchProduct, clearCurrentProduct } = useProductStore()
  const { addToCart } = useCartStore()
  const { user, isUserAuthenticated, addToWishlist, removeFromWishlist } = useUserAuthStore()
  const { formatPrice } = useCurrencyStore()
  const { t } = useLanguageStore()

  useEffect(() => {
    if (id) {
      fetchProduct(id)
    }
    
    return () => {
      clearCurrentProduct()
    }
  }, [id, fetchProduct, clearCurrentProduct])

  const product = currentProduct

  const isInWishlist = user?.wishlist?.some(item => 
    (typeof item === 'string' ? item : item._id) === product?._id
  )

  const handleWishlist = async () => {
    if (!isUserAuthenticated) {
      toast.error(t('pleaseLoginWishlist'))
      navigate('/login')
      return
    }

    try {
      if (isInWishlist) {
        await removeFromWishlist(product._id)
        toast.success(t('removedFromWishlist'))
      } else {
        await addToWishlist(product._id)
        toast.success(t('addedToWishlist'))
      }
    } catch (error) {
      toast.error('Failed to update wishlist')
    }
  }

  const handleAddToCart = async () => {
    if (!currentProduct) return
    
    try {
      await addToCart(currentProduct, selectedQuantity)
      toast.success(t('addedToCart'))
    } catch (error) {
      toast.error(t('failedToAddCart'))
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    navigate('/cart')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Product not found</h2>
          <Button onClick={() => navigate('/products')}>
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Products
          </button>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div>
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0].url.startsWith('http') ? product.images[0].url : `http://localhost:5000${product.images[0].url}`}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    // Use local placeholder instead of external service
                    const canvas = document.createElement('canvas')
                    canvas.width = 400
                    canvas.height = 400
                    const ctx = canvas.getContext('2d')
                    ctx.fillStyle = '#6366f1'
                    ctx.fillRect(0, 0, 400, 400)
                    ctx.fillStyle = '#ffffff'
                    ctx.font = '24px Arial'
                    ctx.textAlign = 'center'
                    ctx.fillText('Product Image', 200, 200)
                    e.target.src = canvas.toDataURL()
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <ShoppingCart className="h-12 w-12 text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No image available</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Additional Images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {product.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src={image.url.startsWith('http') ? image.url : `http://localhost:5000${image.url}`}
                      alt={`${product.name} ${index + 2}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        const canvas = document.createElement('canvas')
                        canvas.width = 200
                        canvas.height = 200
                        const ctx = canvas.getContext('2d')
                        ctx.fillStyle = '#6366f1'
                        ctx.fillRect(0, 0, 200, 200)
                        ctx.fillStyle = '#ffffff'
                        ctx.font = '12px Arial'
                        ctx.textAlign = 'center'
                        ctx.fillText('Image', 100, 100)
                        e.target.src = canvas.toDataURL()
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                {product.shortDescription || product.description}
              </p>

              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating?.average || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {product.rating?.average?.toFixed(1) || '0.0'} ({product.rating?.count || 0} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-4 mb-6">
                {product.price ? (
                  <>
                    <Price 
                      amount={product.price} 
                      size="2xl"
                      className="text-primary-600 font-bold"
                      showOriginal={false}
                    />
                    {product.originalPrice && product.originalPrice > product.price && (
                      <>
                        <Price 
                          amount={product.originalPrice}
                          size="xl"
                          className="text-gray-500 dark:text-gray-400 line-through"
                        />
                        <span className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 px-2 py-1 rounded-full text-sm font-medium">
                          Save <Price amount={product.originalPrice - product.price} className="inline" />
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-lg text-gray-500 dark:text-gray-400">Price not available</span>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`font-medium ${product.stock > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity
                </label>
                <select
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button
                  variant="primary"
                  size="large"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="secondary"
                  size="large"
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1"
                >
                  Buy Now
                </Button>
              </div>

              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  className={`flex-1 ${isInWishlist ? 'text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : ''}`}
                  onClick={handleWishlist}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isInWishlist ? 'fill-current' : ''}`} />
                  {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Truck className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Free Shipping</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">On orders over <Price amount={500} className="inline" /></div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Secure Payment</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">100% secure checkout</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Easy Returns</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">30-day return policy</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'description', label: 'Description' },
                { id: 'specifications', label: 'Specifications' },
                { id: 'reviews', label: `Reviews (${product.rating?.count || 0})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {product.description}
                </p>
                
                {product.specifications?.features && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Features</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {product.specifications.features.map((feature, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {product.specifications?.dimensions && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dimensions</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Length:</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">{product.specifications.dimensions.length} {product.specifications.dimensions.unit}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Width:</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">{product.specifications.dimensions.width} {product.specifications.dimensions.unit}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Height:</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">{product.specifications.dimensions.height} {product.specifications.dimensions.unit}</dd>
                      </div>
                    </dl>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Details</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">SKU:</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">{product.sku}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">Category:</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">{product.category}</dd>
                    </div>
                    {product.brand && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Brand:</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">{product.brand}</dd>
                      </div>
                    )}
                    {product.specifications?.weight && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Weight:</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">{product.specifications.weight.value} {product.specifications.weight.unit}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {product.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {/* Write Review Button */}
                    {isUserAuthenticated && (
                      <div className="flex justify-end">
                        <Button 
                          variant="primary"
                          onClick={() => setShowSimpleReview(true)}
                        >
                          Write a Review
                        </Button>
                      </div>
                    )}
                    
                    {product.reviews.map((review) => (
                      <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {review.user?.displayName?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{review.user?.displayName || 'Anonymous'}</div>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{review.title}</h4>
                        <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                        
                        {/* Seller Reply */}
                        {review.sellerReply && (
                          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-3 rounded-r-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Seller Reply</span>
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                {new Date(review.sellerReply.repliedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">{review.sellerReply.message}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">No reviews yet. Be the first to review this product!</p>
                    {isUserAuthenticated && (
                      <Button 
                        className="mt-4"
                        onClick={() => setShowSimpleReview(true)}
                      >
                        Write a Review
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Simple Write Review Modal */}
      {showSimpleReview && (
        <SimpleWriteReview
          productId={product._id}
          onClose={() => setShowSimpleReview(false)}
          onSuccess={(review, productRating) => {
            setShowSimpleReview(false)
            // Refresh the product to show the new review
            fetchProduct(id)
            toast.success('Thank you for your review!')
          }}
        />
      )}
    </div>
  )
}

export default ProductDetail