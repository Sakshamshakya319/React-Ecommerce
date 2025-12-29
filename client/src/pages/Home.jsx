import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, ShoppingCart, Eye, Zap, Shield, Truck, Package, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { useProductStore } from '../store/productStore'
import { useCartStore } from '../store/cartStore'
import { useUserAuthStore } from '../store/userAuthStore'
import { useLanguageStore } from '../store/languageStore'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Price from '../components/ui/Price'
import { getReviewCount, getProductRating, cleanProductData } from '../utils/dataUtils'
import toast from 'react-hot-toast'

const Home = () => {
  const { products, fetchProducts, isLoading } = useProductStore()
  const { addToCart } = useCartStore()
  const { 
    user, 
    isUserAuthenticated, 
    addToWishlist, 
    removeFromWishlist 
  } = useUserAuthStore()
  const { t } = useLanguageStore()
  const [featuredProducts, setFeaturedProducts] = useState([])

  useEffect(() => {
    fetchProducts({ limit: 6, featured: true })
  }, [fetchProducts])

  useEffect(() => {
    if (products.length > 0) {
      // Clean product data to prevent rendering issues
      const cleanedProducts = products.slice(0, 6).map(product => {
        const cleaned = cleanProductData(product)
        
        // Debug logging to catch any remaining object issues
        if (typeof cleaned.reviews === 'object' && cleaned.reviews !== null && !Array.isArray(cleaned.reviews)) {
          console.warn('Found object in reviews field:', cleaned.reviews)
          cleaned.reviews = 0
        }
        
        if (typeof cleaned.rating === 'object' && cleaned.rating !== null) {
          console.warn('Found object in rating field:', cleaned.rating)
          cleaned.rating = 4.5
        }
        
        return cleaned
      })
      setFeaturedProducts(cleanedProducts)
    }
  }, [products])

  const handleAddToCart = async (product, e) => {
    e.preventDefault()
    try {
      await addToCart(product, 1)
      toast.success('Added to cart!')
    } catch (error) {
      toast.error('Failed to add to cart')
    }
  }

  const handleWishlistToggle = async (product, e) => {
    e.preventDefault()
    
    if (!isUserAuthenticated) {
      toast.error('Please login to add to wishlist')
      return
    }

    try {
      const isInWishlist = user?.wishlist?.some(item => 
        (typeof item === 'string' ? item : item._id) === product._id
      )

      if (isInWishlist) {
        await removeFromWishlist(product._id)
        toast.success('Removed from wishlist')
      } else {
        await addToWishlist(product._id)
        toast.success('Added to wishlist')
      }
    } catch (error) {
      toast.error('Failed to update wishlist')
    }
  }

  const features = [
    {
      icon: <Eye className="h-8 w-8 text-primary-600" />,
      title: t('feature1Title'),
      description: t('feature1Desc')
    },
    {
      icon: <Zap className="h-8 w-8 text-primary-600" />,
      title: t('feature2Title'),
      description: t('feature2Desc')
    },
    {
      icon: <Shield className="h-8 w-8 text-primary-600" />,
      title: t('feature3Title'),
      description: t('feature3Desc')
    },
    {
      icon: <Truck className="h-8 w-8 text-primary-600" />,
      title: t('feature4Title'),
      description: t('feature4Desc')
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20 dark:opacity-40"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative w-full px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Hero Content */}
            <motion.div 
              className="space-y-8 z-10"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                {t('heroTitle')}
                <span className="block text-yellow-400 dark:text-yellow-300">{t('heroSubtitle')}</span>
              </h1>
              <p className="text-xl text-gray-200 dark:text-gray-300 leading-relaxed">
                {t('heroDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="secondary"
                  size="large"
                  className="bg-white text-primary-700 hover:bg-gray-100 dark:bg-gray-100 dark:text-primary-800 dark:hover:bg-white font-semibold"
                  onClick={() => document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('exploreProducts')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                <img
                  src="/home.png"
                  alt="Shopping Experience"
                  className="w-full h-auto max-w-lg mx-auto rounded-2xl shadow-2xl"
                  onError={(e) => {
                    console.error('Failed to load home image')
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4='
                  }}
                  onLoad={() => {
                    console.log('Home image loaded successfully')
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-600/20 to-transparent rounded-2xl"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('featuresTitle')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t('featuresSubtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Seller Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {t('becomeSellerTitle') || 'Become a Seller'}
                </h2>
                <p className="text-xl text-primary-100 dark:text-primary-200 mb-6 leading-relaxed">
                  {t('becomeSellerDesc') || 'Join our marketplace and start selling your products with great visibility. Reach customers worldwide and grow your business.'}
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                    <span>{t('sellerBenefit1') || 'Upload images and details of your products'}</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                    <span>{t('sellerBenefit2') || 'Reach global customers'}</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                    <span>{t('sellerBenefit3') || 'Easy inventory management'}</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                    <span>{t('sellerBenefit4') || 'Secure payment processing'}</span>
                  </li>
                </ul>
                <Link to="/seller/register">
                  <Button
                    variant="secondary"
                    size="large"
                    className="bg-white text-primary-700 hover:bg-gray-100 dark:bg-gray-100 dark:text-primary-800 dark:hover:bg-white font-semibold"
                  >
                    {t('startSelling') || 'Start Selling Today'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div
                className="relative"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-400">1000+</div>
                      <div className="text-sm text-primary-100">{t('activeSellers') || 'Active Sellers'}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-400">50K+</div>
                      <div className="text-sm text-primary-100">{t('productsListed') || 'Products Listed'}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-400">₹10M+</div>
                      <div className="text-sm text-primary-100">{t('totalSales') || 'Total Sales'}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-400">4.8★</div>
                      <div className="text-sm text-primary-100">{t('avgRating') || 'Avg Rating'}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="featured-products" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('featuredProducts')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('discoverPopular')}
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center">
              <LoadingSpinner size="large" />
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product, index) => (
                  <motion.div 
                    key={product._id} 
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    {product.images?.[0] ? (
                      <img
                        src={getImageUrl(product.images[0].url)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={createImageErrorHandler('Product Image', 400, 400)}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    {product.discount > 0 && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                        -{product.discount}%
                      </div>
                    )}

                    {/* Wishlist Button */}
                    {isUserAuthenticated && (
                      <button
                        onClick={(e) => handleWishlistToggle(product, e)}
                        className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Heart 
                          className={`h-4 w-4 ${
                            user?.wishlist?.some(item => 
                              (typeof item === 'string' ? item : item._id) === product._id
                            ) 
                              ? 'text-red-500 fill-current' 
                              : 'text-gray-400 hover:text-red-500'
                          }`} 
                        />
                      </button>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    
                    {/* Rating */}
                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(getProductRating(product))
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        ({(() => {
                          const count = getReviewCount(product)
                          return typeof count === 'number' ? count : 0
                        })()} {(() => {
                          const count = getReviewCount(product)
                          const safeCount = typeof count === 'number' ? count : 0
                          return safeCount === 1 ? t('review') : t('reviews')
                        })()})
                      </span>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between">
                      <Price 
                        amount={product.price} 
                        size="xl"
                        className="text-primary-600 dark:text-primary-400 font-bold"
                      />
                      <div className="flex space-x-2">
                        <Link to={`/products/${product._id}`}>
                          <Button 
                            variant="outline" 
                            size="small"
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            {t('viewDetails')}
                          </Button>
                        </Link>
                        <Button 
                          variant="primary" 
                          size="small"
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={product.stock === 0}
                          className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white"
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          {product.stock === 0 ? t('outOfStock') : t('addToCart')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('noFeaturedProducts')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('checkBackLater')}
              </p>
              <Link to="/products">
                <Button variant="primary">
                  {t('browseAllProducts')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {/* View All Products Button */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Link to="/products">
              <Button 
                variant="primary" 
                size="large"
                className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold"
              >
                {t('viewAllProducts')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 dark:bg-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Experience Reality?
            </h2>
            <p className="text-xl text-primary-100 dark:text-primary-200 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who have revolutionized their shopping experience with our advanced technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button variant="secondary" size="large" className="bg-white text-primary-700 hover:bg-gray-100 dark:bg-gray-100 dark:text-primary-800 dark:hover:bg-white !text-primary-700 dark:!text-primary-800">
                  <span className="text-primary-700 dark:text-primary-800">Get Started Free</span>
                </Button>
              </Link>

              <Link to="/products">
                <Button variant="secondary" size="large" className="bg-white text-primary-700 hover:bg-gray-100 dark:bg-gray-100 dark:text-primary-800 dark:hover:bg-white !text-primary-700 dark:!text-primary-800">
                  <span className="text-primary-700 dark:text-primary-800">Browse Products</span>
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home