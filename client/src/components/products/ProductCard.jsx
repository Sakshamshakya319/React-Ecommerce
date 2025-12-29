import React from 'react'
import { Link } from 'react-router-dom'
import { Star, ShoppingCart, Heart, Package } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUserAuthStore } from '../../store/userAuthStore'
import { useLanguageStore } from '../../store/languageStore'
import Button from '../ui/Button'
import Price from '../ui/Price'
import { getImageUrl, createImageErrorHandler } from '../../utils/imageUtils'
import toast from 'react-hot-toast'

const ProductCard = ({ 
  product, 
  onAddToCart, 
  onWishlistToggle, 
  viewMode = 'grid',
  index = 0 
}) => {
  const { user, isUserAuthenticated } = useUserAuthStore()
  const { t } = useLanguageStore()

  const isInWishlist = user?.wishlist?.some(item => 
    (typeof item === 'string' ? item : item._id) === product._id
  )

  const handleAddToCart = (e) => {
    e.preventDefault()
    onAddToCart(product)
  }

  const handleWishlistToggle = (e) => {
    e.preventDefault()
    
    if (!isUserAuthenticated) {
      toast.error(t('pleaseLoginWishlist'))
      return
    }

    onWishlistToggle(product, e)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
        ${viewMode === 'list' ? 'flex items-stretch' : 'flex flex-col h-full'}
      `}
    >
      {/* Product Image */}
      <div className={`relative ${
        viewMode === 'list' 
          ? 'w-48 h-48 flex-shrink-0' 
          : 'w-full aspect-square'
      }`}>
        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={getImageUrl(product.images[0].url)}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={createImageErrorHandler('Product Image', 400, 400)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-16 w-16 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>
        
        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
            -{product.discount}%
          </div>
        )}

        {/* Wishlist Button */}
        {isUserAuthenticated && (
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={isInWishlist ? t('removeFromWishlist') : t('addToWishlist')}
          >
            <Heart 
              className={`h-4 w-4 ${
                isInWishlist
                  ? 'text-red-500 fill-current' 
                  : 'text-gray-400 hover:text-red-500'
              }`} 
            />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className={`p-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : 'flex-1 flex flex-col'}`}>
        <div className="flex-1">
          <div className="mb-3">
            <h3 className={`font-semibold text-gray-900 dark:text-white ${
              viewMode === 'list' ? 'text-lg mb-2' : 'text-base mb-1'
            } line-clamp-2`}>
              {product.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
              {product.description}
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
              ({product.rating?.count || 0} {product.rating?.count === 1 ? t('review') : t('reviews')})
            </span>
          </div>
        </div>

        {/* Price and Actions */}
        <div className={`${viewMode === 'list' ? 'flex items-center justify-between' : 'space-y-3'}`}>
          <div className="flex items-center space-x-2">
            <Price 
              amount={product.price} 
              size={viewMode === 'list' ? 'lg' : 'base'}
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
          
          <div className={`flex gap-2 ${viewMode === 'list' ? 'flex-row' : 'flex-col sm:flex-row'}`}>
            <Link to={`/products/${product._id}`} className={viewMode === 'grid' ? 'flex-1' : ''}>
              <Button 
                variant="outline" 
                size="small" 
                className={`${viewMode === 'grid' ? 'w-full' : ''} text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700`}
              >
                {t('viewDetails')}
              </Button>
            </Link>
            <Button
              variant="primary"
              size="small"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`${viewMode === 'grid' ? 'flex-1' : ''} text-xs bg-primary-600 hover:bg-primary-700 text-white disabled:bg-gray-400 dark:disabled:bg-gray-600`}
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              {product.stock === 0 ? t('outOfStock') : t('addToCart')}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProductCard