import React, { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Filter, Grid, List, Star, ShoppingCart, Search, X, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { useProductStore } from '../store/productStore'
import { useCartStore } from '../store/cartStore'
import { useUserAuthStore } from '../store/userAuthStore'
import { useCurrencyStore } from '../store/currencyStore'
import { useLanguageStore } from '../store/languageStore'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Price from '../components/ui/Price'
import toast from 'react-hot-toast'

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState({
    category: searchParams.get('category') || '',
    priceRange: [0, 10000], // Increased range for INR
    search: searchParams.get('search') || '',
    sortBy: 'name'
  })

  const { 
    products, 
    categories, 
    filters, 
    pagination, 
    isLoading, 
    fetchProducts, 
    fetchCategories, 
    updateFilters, 
    updatePagination 
  } = useProductStore()

  const { addToCart } = useCartStore()
  const { 
    user, 
    isUserAuthenticated, 
    addToWishlist, 
    removeFromWishlist 
  } = useUserAuthStore()
  const { formatPrice, convertPrice } = useCurrencyStore()
  const { t } = useLanguageStore()

  // Fetch products and categories on mount
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  // Update filters from URL params
  useEffect(() => {
    const urlFilters = {
      category: searchParams.get('category') || '',
      search: searchParams.get('search') || '',
      sortBy: searchParams.get('sortBy') || 'name'
    }
    
    setLocalFilters(prev => ({ ...prev, ...urlFilters }))
    updateFilters(urlFilters)
  }, [searchParams, updateFilters])

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    setSearchParams(newParams)
    
    // Update store filters
    updateFilters(newFilters)
  }

  const handlePriceRangeChange = (range) => {
    setLocalFilters(prev => ({ ...prev, priceRange: range }))
    updateFilters({ ...localFilters, priceRange: range })
  }

  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      priceRange: [0, 1000000],
      search: '',
      sortBy: 'name'
    }
    setLocalFilters(clearedFilters)
    setSearchParams({})
    updateFilters(clearedFilters)
  }

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product, 1)
      toast.success(t('addedToCart'))
    } catch (error) {
      toast.error(t('failedToAddCart'))
    }
  }

  const handleWishlistToggle = async (product, e) => {
    e.preventDefault() // Prevent navigation when clicking wishlist button
    
    if (!isUserAuthenticated) {
      toast.error(t('pleaseLoginWishlist'))
      return
    }

    try {
      const isInWishlist = user?.wishlist?.some(item => 
        (typeof item === 'string' ? item : item._id) === product._id
      )

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

  const handlePageChange = (page) => {
    updatePagination({ page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Memoized filter sidebar
  const FilterSidebar = useMemo(() => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('search')}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            value={localFilters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder={t('search')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('category')}
        </label>
        <select
          value={localFilters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Categories</option>
          {Array.isArray(categories) && categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('price')} Range
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="100000"
            step="100"
            value={localFilters.priceRange[1]}
            onChange={(e) => handlePriceRangeChange([0, parseInt(e.target.value)])}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{formatPrice(0)}</span>
            <span><Price amount={localFilters.priceRange[1]} /></span>
          </div>
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sort By
        </label>
        <select
          value={localFilters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="name">Name</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
          <option value="-rating.average">Rating</option>
          <option value="-createdAt">Newest</option>
          <option value="-salesCount">Best Selling</option>
        </select>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        onClick={clearFilters}
        className="w-full"
      >
        Clear All Filters
      </Button>
    </div>
  ), [localFilters, categories, handleFilterChange, handlePriceRangeChange, clearFilters])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('products')}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Discover our collection of products
            </p>
          </div>
          
          {/* View Controls */}
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md sticky top-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {FilterSidebar}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Info */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Showing {products.length} of {pagination.total} products
              </p>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="large" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                {/* Products */}
                <div className={`
                  ${viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                    : 'space-y-4'
                  }
                `}>
                  {products.map((product) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
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
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].url.startsWith('http') ? product.images[0].url : `http://localhost:5000${product.images[0].url}`}
                              alt={product.images[0].alt || product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingCart className="h-16 w-16" />
                            </div>
                          )}
                        </div>
                        
                        {/* Badges */}
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
                              ({product.rating?.count || 0})
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
                              onClick={() => handleAddToCart(product)}
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
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrev}
                      >
                        Previous
                      </Button>
                      
                      {[...Array(pagination.totalPages)].map((_, i) => {
                        const page = i + 1
                        if (
                          page === 1 ||
                          page === pagination.totalPages ||
                          (page >= pagination.page - 2 && page <= pagination.page + 2)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={page === pagination.page ? 'primary' : 'outline'}
                              onClick={() => handlePageChange(page)}
                              size="small"
                            >
                              {page}
                            </Button>
                          )
                        } else if (
                          page === pagination.page - 3 ||
                          page === pagination.page + 3
                        ) {
                          return <span key={page} className="px-2">...</span>
                        }
                        return null
                      })}
                      
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products