import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '../api/client'
import toast from 'react-hot-toast'

export const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],
      isLoading: false,
      total: 0,

      // Actions
      initializeCart: () => {
        const { calculateTotal } = get()
        calculateTotal()
      },

      // Add item to cart
      addToCart: async (product, quantity = 1, variant = null) => {
        try {
          const { items } = get()
          const existingItemIndex = items.findIndex(
            item => item.product._id === product._id && 
            JSON.stringify(item.variant) === JSON.stringify(variant)
          )

          let newItems
          if (existingItemIndex >= 0) {
            // Update existing item quantity
            newItems = items.map((item, index) =>
              index === existingItemIndex
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          } else {
            // Add new item
            newItems = [
              ...items,
              {
                id: `${product._id}_${Date.now()}`,
                product,
                quantity,
                variant,
                addedAt: new Date().toISOString()
              }
            ]
          }

          set({ items: newItems })
          get().calculateTotal()
          
          toast.success(`${product.name} added to cart!`)
          
          // Sync with backend if user is authenticated
          get().syncCartWithBackend()
        } catch (error) {
          console.error('Add to cart error:', error)
          toast.error('Failed to add item to cart')
        }
      },

      // Remove item from cart
      removeFromCart: (itemId) => {
        try {
          const { items } = get()
          const newItems = items.filter(item => item.id !== itemId)
          
          set({ items: newItems })
          get().calculateTotal()
          
          toast.success('Item removed from cart')
          
          // Sync with backend
          get().syncCartWithBackend()
        } catch (error) {
          console.error('Remove from cart error:', error)
          toast.error('Failed to remove item from cart')
        }
      },

      // Update item quantity
      updateQuantity: (itemId, quantity) => {
        try {
          if (quantity <= 0) {
            get().removeFromCart(itemId)
            return
          }

          const { items } = get()
          const newItems = items.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          )

          set({ items: newItems })
          get().calculateTotal()
          
          // Sync with backend
          get().syncCartWithBackend()
        } catch (error) {
          console.error('Update quantity error:', error)
          toast.error('Failed to update quantity')
        }
      },

      // Clear cart
      clearCart: () => {
        set({ items: [], total: 0 })
        get().syncCartWithBackend()
        toast.success('Cart cleared')
      },

      // Calculate total
      calculateTotal: () => {
        const { items } = get()
        const total = items.reduce((sum, item) => {
          // Ensure price is a valid number
          const price = parseFloat(item.variant?.price || item.product?.price || 0)
          const quantity = parseInt(item.quantity || 0)
          
          if (isNaN(price) || isNaN(quantity)) {
            console.warn('Invalid price or quantity:', { price, quantity, item })
            return sum
          }
          
          return sum + (price * quantity)
        }, 0)
        
        set({ total: isNaN(total) ? 0 : total })
      },

      // Get cart item count
      getItemCount: () => {
        const { items } = get()
        return items.reduce((count, item) => count + (parseInt(item.quantity) || 0), 0)
      },

      // Sync cart with backend
      syncCartWithBackend: async () => {
        try {
          const { items } = get()
          
          // Only sync if user is authenticated and has items
          if (items.length === 0) return
          
          // Import userAuthStore dynamically to avoid circular dependency
          const { useUserAuthStore } = await import('./userAuthStore')
          const userAuthStore = useUserAuthStore.getState()
          if (!userAuthStore?.isUserAuthenticated || !userAuthStore?.userToken) {
            console.log('User not authenticated, skipping cart sync')
            return
          }

          console.log('Syncing cart with backend...')
          await apiClient.post('/cart/sync', { items })
          console.log('Cart synced successfully')
        } catch (error) {
          console.error('Cart sync error:', error)
          // Don't show error toast for sync failures as it's not critical
        }
      },

      // Load cart from backend
      loadCartFromBackend: async () => {
        try {
          set({ isLoading: true })
          
          // Check if user is authenticated
          const { useUserAuthStore } = await import('./userAuthStore')
          const userAuthStore = useUserAuthStore.getState()
          if (!userAuthStore?.isUserAuthenticated) {
            set({ isLoading: false })
            return
          }
          
          const response = await apiClient.get('/cart')
          const { cart } = response.data
          
          if (cart && cart.items) {
            set({ items: cart.items || [] })
            get().calculateTotal()
          }
        } catch (error) {
          console.error('Load cart error:', error)
          // Keep local cart if backend fails
        } finally {
          set({ isLoading: false })
        }
      },

      // Initialize cart after login
      initializeCartAfterLogin: async () => {
        try {
          // Load cart from backend and merge with local cart
          await get().loadCartFromBackend()
          
          // Sync any local items with backend
          await get().syncCartWithBackend()
        } catch (error) {
          console.error('Initialize cart after login error:', error)
        }
      },

      // Sync cart prices with current product prices
      syncCartPrices: async () => {
        try {
          const { items } = get()
          if (items.length === 0) return

          console.log('Syncing cart prices with current product prices...')
          let hasUpdates = false
          
          const updatedItems = await Promise.all(
            items.map(async (item) => {
              try {
                // Fetch current product data
                const response = await apiClient.get(`/products/${item.product._id}`)
                const currentProduct = response.data.product
                
                // Get current price
                let currentPrice = currentProduct.price
                if (item.variant && currentProduct.variants?.length > 0) {
                  const productVariant = currentProduct.variants.find(v => 
                    v.color === item.variant.color && v.material === item.variant.material
                  )
                  if (productVariant) {
                    currentPrice = productVariant.price
                  }
                }
                
                // Check if price has changed
                const oldPrice = parseFloat(item.variant?.price || item.product?.price || 0)
                if (Math.abs(currentPrice - oldPrice) > 0.01) {
                  hasUpdates = true
                  console.log(`Price updated for ${currentProduct.name}: ${oldPrice} → ${currentPrice}`)
                  
                  // Update item with current product data and price
                  return {
                    ...item,
                    product: {
                      ...currentProduct,
                      price: currentPrice
                    },
                    variant: item.variant ? {
                      ...item.variant,
                      price: currentPrice
                    } : null
                  }
                }
                
                // Update product data even if price hasn't changed
                return {
                  ...item,
                  product: currentProduct
                }
              } catch (error) {
                console.error(`Error fetching product ${item.product._id}:`, error)
                return item // Keep original item if fetch fails
              }
            })
          )
          
          if (hasUpdates) {
            set({ items: updatedItems })
            get().calculateTotal()
            toast.success('Cart prices updated with current prices')
            
            // Sync with backend
            get().syncCartWithBackend()
          } else {
            // Still update items with fresh product data
            set({ items: updatedItems })
          }
          
          console.log('Cart price sync completed')
        } catch (error) {
          console.error('Cart price sync error:', error)
        }
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        total: state.total
      })
    }
  )
)