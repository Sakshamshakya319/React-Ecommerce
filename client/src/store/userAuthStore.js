import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '../api/client'
import { AUTH_TYPES, STORAGE_KEYS } from './authTypes'

export const useUserAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      userToken: null,
      isUserAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user) => set({ user }),
      
      setUserToken: (token) => set({ userToken: token }),
      
      userLogin: (user, token) => {
        set({ 
          user, 
          userToken: token, 
          isUserAuthenticated: true,
          isLoading: false
        })
        localStorage.setItem(STORAGE_KEYS.USER_TOKEN, token)
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
      },
      
      userLogout: () => {
        set({ 
          user: null, 
          userToken: null, 
          isUserAuthenticated: false,
          isLoading: false
        })
        localStorage.removeItem(STORAGE_KEYS.USER_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_DATA)
        // Clear any other user-related data
        localStorage.removeItem('cart')
        localStorage.removeItem('wishlist')
      },
      
      initializeUserAuth: () => {
        console.log('Initializing user auth...')
        set({ isLoading: true })
        
        try {
          const userToken = localStorage.getItem(STORAGE_KEYS.USER_TOKEN)
          const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
          
          console.log('User auth check:', { 
            hasToken: !!userToken, 
            hasData: !!userData,
            tokenLength: userToken?.length || 0
          })
          
          if (userToken && userData) {
            try {
              const user = JSON.parse(userData)
              console.log('User data parsed successfully:', user.email)
              
              // Validate that the user object has required fields
              if (user.email && user._id) {
                set({ 
                  user, 
                  userToken, 
                  isUserAuthenticated: true,
                  isLoading: false
                })
                console.log('User authentication restored successfully')
              } else {
                console.log('Invalid user data structure, clearing auth')
                get().userLogout()
              }
            } catch (parseError) {
              console.error('Error parsing user data:', parseError)
              get().userLogout()
            }
          } else {
            console.log('No user token or data found, setting unauthenticated')
            set({ 
              user: null,
              userToken: null,
              isUserAuthenticated: false,
              isLoading: false 
            })
          }
        } catch (error) {
          console.error('Error initializing user auth:', error)
          set({ 
            user: null,
            userToken: null,
            isUserAuthenticated: false,
            isLoading: false 
          })
        }
      },

      // Check if user is authenticated and not admin/seller
      isOnlyUser: () => {
        const { isUserAuthenticated } = get()
        const adminToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
        const sellerToken = localStorage.getItem(STORAGE_KEYS.SELLER_TOKEN)
        
        return isUserAuthenticated && !adminToken && !sellerToken
      },

      // Wishlist Actions
      addToWishlist: async (productId) => {
        try {
          const response = await apiClient.post(`/users/wishlist/${productId}`)
          set(state => ({
            user: {
              ...state.user,
              wishlist: response.data.wishlist
            }
          }))
          const userData = get().user
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
          return true
        } catch (error) {
          console.error('Add to wishlist error:', error)
          throw error
        }
      },

      removeFromWishlist: async (productId) => {
        try {
          const response = await apiClient.delete(`/users/wishlist/${productId}`)
          set(state => ({
            user: {
              ...state.user,
              wishlist: response.data.wishlist
            }
          }))
          const userData = get().user
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
          return true
        } catch (error) {
          console.error('Remove from wishlist error:', error)
          throw error
        }
      },

      fetchWishlist: async () => {
        try {
          const response = await apiClient.get('/users/wishlist')
          set(state => ({
            user: {
              ...state.user,
              wishlist: response.data.wishlist
            }
          }))
          const userData = get().user
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
        } catch (error) {
          console.error('Fetch wishlist error:', error)
        }
      },

      // Profile Actions
      fetchUserProfile: async () => {
        try {
          const response = await apiClient.get('/users/profile')
          const userData = response.data.user
          
          set(state => ({
            user: {
              ...state.user,
              ...userData
            }
          }))
          
          // Update local storage
          const currentUser = get().user
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser))
          
          return userData
        } catch (error) {
          console.error('Fetch profile error:', error)
          throw error
        }
      },

      updateProfile: async (profileData) => {
        try {
          set({ isLoading: true })
          const response = await apiClient.put('/users/profile', profileData)
          const updatedUser = response.data.user
          
          set(state => ({
            user: {
              ...state.user,
              ...updatedUser
            },
            isLoading: false
          }))
          
          // Update local storage
          const currentUser = get().user
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser))
          
          return updatedUser
        } catch (error) {
          console.error('Update profile error:', error)
          set({ isLoading: false })
          throw error
        }
      }
    }),
    {
      name: 'user-auth-storage',
      partialize: (state) => ({
        user: state.user,
        userToken: state.userToken,
        isUserAuthenticated: state.isUserAuthenticated
      })
    }
  )
)