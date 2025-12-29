import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AUTH_TYPES, STORAGE_KEYS } from './authTypes'

export const useSellerAuthStore = create(
  persist(
    (set, get) => ({
      // State
      seller: null,
      sellerToken: null,
      isSellerAuthenticated: false,
      isLoading: false,

      // Actions
      setSeller: (seller) => set({ seller }),
      
      setSellerToken: (token) => set({ sellerToken: token }),
      
      sellerLogin: (seller, token) => {
        console.log('SellerAuthStore: sellerLogin called', { 
          seller: seller?.businessName, 
          tokenLength: token?.length 
        })
        
        // Clear other auth types first
        localStorage.removeItem(STORAGE_KEYS.USER_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_DATA)
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA)
        
        // Set seller auth
        set({ 
          seller, 
          sellerToken: token, 
          isSellerAuthenticated: true 
        })
        
        // Store in localStorage
        localStorage.setItem(STORAGE_KEYS.SELLER_TOKEN, token)
        localStorage.setItem(STORAGE_KEYS.SELLER_DATA, JSON.stringify(seller))
        
        console.log('SellerAuthStore: Data stored successfully', {
          tokenStored: !!localStorage.getItem(STORAGE_KEYS.SELLER_TOKEN),
          dataStored: !!localStorage.getItem(STORAGE_KEYS.SELLER_DATA)
        })
      },
      
      sellerLogout: () => {
        set({ 
          seller: null, 
          sellerToken: null, 
          isSellerAuthenticated: false 
        })
        localStorage.removeItem(STORAGE_KEYS.SELLER_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.SELLER_DATA)
      },
      
      initializeSellerAuth: () => {
        console.log('Initializing seller auth...')
        
        try {
          const sellerToken = localStorage.getItem(STORAGE_KEYS.SELLER_TOKEN)
          const sellerData = localStorage.getItem(STORAGE_KEYS.SELLER_DATA)
          
          console.log('Seller auth check:', { 
            hasToken: !!sellerToken, 
            hasData: !!sellerData,
            tokenLength: sellerToken?.length || 0
          })
          
          if (sellerToken && sellerData) {
            try {
              const seller = JSON.parse(sellerData)
              console.log('Seller data parsed successfully:', seller.businessName)
              
              // Validate that the seller object has required fields
              if (seller.businessName && seller._id) {
                set({ 
                  seller, 
                  sellerToken, 
                  isSellerAuthenticated: true 
                })
                console.log('Seller authentication restored successfully')
              } else {
                console.log('Invalid seller data structure, clearing auth')
                get().sellerLogout()
              }
            } catch (parseError) {
              console.error('Error parsing seller data:', parseError)
              get().sellerLogout()
            }
          } else {
            console.log('No seller token or data found')
            set({ 
              seller: null,
              sellerToken: null,
              isSellerAuthenticated: false 
            })
          }
        } catch (error) {
          console.error('Error initializing seller auth:', error)
          set({ 
            seller: null,
            sellerToken: null,
            isSellerAuthenticated: false 
          })
        }
      },

      // Check if only seller is authenticated
      isOnlySeller: () => {
        const { isSellerAuthenticated } = get()
        const userToken = localStorage.getItem(STORAGE_KEYS.USER_TOKEN)
        const adminToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
        
        return isSellerAuthenticated && !userToken && !adminToken
      }
    }),
    {
      name: 'seller-auth-storage',
      partialize: (state) => ({
        seller: state.seller,
        sellerToken: state.sellerToken,
        isSellerAuthenticated: state.isSellerAuthenticated
      })
    }
  )
)