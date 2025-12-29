import { create } from 'zustand'
import { apiClient } from '../api/client'
import { cleanProductData } from '../utils/dataUtils'
import toast from 'react-hot-toast'

export const useProductStore = create((set, get) => ({
  // State
  products: [],
  currentProduct: null,
  categories: [],
  filters: {
    category: '',
    priceRange: [0, 1000000],
    search: '',
    sortBy: 'name'
  },
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  },
  isLoading: false,
  error: null,

  // Actions
  
  // Fetch all products with filters
  fetchProducts: async (filters = {}) => {
    try {
      set({ isLoading: true, error: null })
      
      const currentFilters = get().filters
      const currentPagination = get().pagination
      
      // Build query parameters
      const params = new URLSearchParams()
      params.append('page', currentPagination.page.toString())
      params.append('limit', currentPagination.limit.toString())
      
      // Add filters
      if (currentFilters.category) params.append('category', currentFilters.category)
      if (currentFilters.search) params.append('search', currentFilters.search)
      if (currentFilters.sortBy) params.append('sortBy', currentFilters.sortBy)
      
      // Handle price range properly
      if (currentFilters.priceRange && Array.isArray(currentFilters.priceRange)) {
        params.append('minPrice', currentFilters.priceRange[0].toString())
        params.append('maxPrice', currentFilters.priceRange[1].toString())
      }
      
      // Override with any passed filters
      Object.keys(filters).forEach(key => {
        if (key === 'priceRange' && Array.isArray(filters[key])) {
          params.set('minPrice', filters[key][0].toString())
          params.set('maxPrice', filters[key][1].toString())
        } else if (filters[key] !== undefined && filters[key] !== '') {
          params.set(key, filters[key].toString())
        }
      })

      const response = await apiClient.get(`/products?${params.toString()}`)
      const { products, pagination } = response.data

      // Clean product data to prevent rendering issues
      const cleanedProducts = Array.isArray(products) ? products.map(cleanProductData) : []

      set({
        products: cleanedProducts,
        pagination: pagination || currentPagination,
        isLoading: false
      })
    } catch (error) {
      console.error('Fetch products error:', error)
      set({
        error: error.message || 'Failed to fetch products',
        isLoading: false,
        products: [],
        categories: []
      })
      toast.error('Failed to load products')
    }
  },

  // Fetch single product
  fetchProduct: async (id) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get(`/products/${id}`)
      const product = response.data.product

      // Clean product data to prevent rendering issues
      const cleanedProduct = cleanProductData(product)

      set({
        currentProduct: cleanedProduct,
        isLoading: false
      })
      
      return cleanedProduct
    } catch (error) {
      console.error('Fetch product error:', error)
      set({
        error: error.message || 'Failed to fetch product',
        isLoading: false
      })
      toast.error('Failed to load product')
      throw error
    }
  },

  // Search products
  searchProducts: async (searchTerm) => {
    try {
      set({ 
        filters: { ...get().filters, search: searchTerm },
        pagination: { ...get().pagination, page: 1 }
      })
      
      await get().fetchProducts()
    } catch (error) {
      console.error('Search products error:', error)
      toast.error('Search failed')
    }
  },

  // Add review
  addReview: async (productId, reviewData) => {
    try {
      const response = await apiClient.post(`/products/${productId}/reviews`, reviewData)
      const updatedReviews = response.data.reviews
      
      // Update current product with new reviews
      set(state => {
        if (state.currentProduct && state.currentProduct._id === productId) {
          const newRating = {
             count: updatedReviews.length,
             average: updatedReviews.reduce((acc, item) => item.rating + acc, 0) / updatedReviews.length
          }
          
          return {
            currentProduct: {
              ...state.currentProduct,
              reviews: updatedReviews,
              rating: newRating
            }
          }
        }
        return {}
      })

      toast.success('Review added successfully')
      return true
    } catch (error) {
      console.error('Add review error:', error)
      const message = error.response?.data?.message || 'Failed to add review'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Update filters
  updateFilters: (newFilters) => {
    set({
      filters: { ...get().filters, ...newFilters },
      pagination: { ...get().pagination, page: 1 }
    })
    get().fetchProducts()
  },

  // Update pagination
  updatePagination: (newPagination) => {
    set({
      pagination: { ...get().pagination, ...newPagination }
    })
    get().fetchProducts()
  },

  // Fetch categories
  fetchCategories: async () => {
    try {
      const response = await apiClient.get('/products/categories')
      set({ categories: response.data.categories || [] })
    } catch (error) {
      console.error('Fetch categories error:', error)
      set({ categories: [] })
      toast.error('Failed to load categories')
    }
  },

  // Clear current product
  clearCurrentProduct: () => {
    set({ currentProduct: null })
  },

  // Reset filters
  resetFilters: () => {
    set({
      filters: {
        category: '',
        priceRange: [0, 100000],
        search: '',
        sortBy: 'name'
      },
      pagination: {
        ...get().pagination,
        page: 1
      }
    })
    get().fetchProducts()
  }
}))

// Admin product management store
export const useAdminProductStore = create((set, get) => ({
  // State
  products: [],
  isLoading: false,
  error: null,

  // Actions
  
  // Create product
  createProduct: async (productData) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.post('/admin/products', productData)
      const newProduct = response.data

      set({
        products: [newProduct, ...get().products],
        isLoading: false
      })

      toast.success('Product created successfully!')
      return newProduct
    } catch (error) {
      console.error('Create product error:', error)
      set({
        error: error.message || 'Failed to create product',
        isLoading: false
      })
      toast.error('Failed to create product')
      throw error
    }
  },

  // Update product
  updateProduct: async (id, productData) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.put(`/admin/products/${id}`, productData)
      const updatedProduct = response.data

      set({
        products: get().products.map(p => 
          p._id === id ? updatedProduct : p
        ),
        isLoading: false
      })

      toast.success('Product updated successfully!')
      return updatedProduct
    } catch (error) {
      console.error('Update product error:', error)
      set({
        error: error.message || 'Failed to update product',
        isLoading: false
      })
      toast.error('Failed to update product')
      throw error
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      set({ isLoading: true, error: null })
      
      await apiClient.delete(`/admin/products/${id}`)

      set({
        products: get().products.filter(p => p._id !== id),
        isLoading: false
      })

      toast.success('Product deleted successfully!')
    } catch (error) {
      console.error('Delete product error:', error)
      set({
        error: error.message || 'Failed to delete product',
        isLoading: false
      })
      toast.error('Failed to delete product')
      throw error
    }
  },

  // Fetch all products for admin
  fetchAllProducts: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await apiClient.get('/admin/products')
      const products = response.data

      set({
        products,
        isLoading: false
      })
    } catch (error) {
      console.error('Fetch admin products error:', error)
      set({
        error: error.message || 'Failed to fetch products',
        isLoading: false
      })
      toast.error('Failed to load products')
    }
  }
}))