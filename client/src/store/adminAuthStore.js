import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AUTH_TYPES, STORAGE_KEYS } from './authTypes'

export const useAdminAuthStore = create(
  persist(
    (set, get) => ({
      // State
      admin: null,
      adminToken: null,
      isAdminAuthenticated: false,
      isLoading: false,

      // Actions
      setAdmin: (admin) => set({ admin }),
      
      setAdminToken: (token) => set({ adminToken: token }),
      
      adminLogin: (admin, token) => {
        // Clear other auth types first
        localStorage.removeItem(STORAGE_KEYS.USER_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_DATA)
        localStorage.removeItem(STORAGE_KEYS.SELLER_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.SELLER_DATA)
        
        set({ 
          admin, 
          adminToken: token, 
          isAdminAuthenticated: true 
        })
        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token)
        localStorage.setItem(STORAGE_KEYS.ADMIN_DATA, JSON.stringify(admin))
      },
      
      adminLogout: () => {
        set({ 
          admin: null, 
          adminToken: null, 
          isAdminAuthenticated: false 
        })
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA)
      },
      
      initializeAdminAuth: () => {
        console.log('Initializing admin auth...')
        set({ isLoading: true })
        
        try {
          const adminToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
          const adminData = localStorage.getItem(STORAGE_KEYS.ADMIN_DATA)
          
          console.log('Admin auth check:', { 
            hasToken: !!adminToken, 
            hasData: !!adminData,
            tokenLength: adminToken?.length || 0
          })
          
          if (adminToken && adminData) {
            try {
              const admin = JSON.parse(adminData)
              console.log('Admin data parsed successfully:', admin.username)
              
              // Validate that the admin object has required fields
              if (
                admin.username &&
                (admin.role === 'admin' || admin.role === 'super-admin' || (admin.role && admin.role.includes('admin')))
              ) {
                set({ 
                  admin, 
                  adminToken, 
                  isAdminAuthenticated: true,
                  isLoading: false 
                })
                console.log('Admin authentication restored successfully')
              } else {
                // Fallback: accept admin if token exists and username is present
                if (admin.username && adminToken) {
                  set({
                    admin,
                    adminToken,
                    isAdminAuthenticated: true,
                    isLoading: false
                  })
                  console.log('Admin authentication restored with token fallback')
                } else {
                  console.log('Invalid admin data structure, clearing auth')
                  get().adminLogout()
                }
              }
            } catch (parseError) {
              console.error('Error parsing admin data:', parseError)
              get().adminLogout()
            }
          } else {
            console.log('No admin token or data found')
            set({ 
              admin: null,
              adminToken: null,
              isAdminAuthenticated: false,
              isLoading: false 
            })
          }
        } catch (error) {
          console.error('Error initializing admin auth:', error)
          set({ 
            admin: null,
            adminToken: null,
            isAdminAuthenticated: false,
            isLoading: false 
          })
        }
      },

      // Check if only admin is authenticated
      isOnlyAdmin: () => {
        const { isAdminAuthenticated } = get()
        const userToken = localStorage.getItem(STORAGE_KEYS.USER_TOKEN)
        const sellerToken = localStorage.getItem(STORAGE_KEYS.SELLER_TOKEN)
        
        return isAdminAuthenticated && !userToken && !sellerToken
      }
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        admin: state.admin,
        adminToken: state.adminToken,
        isAdminAuthenticated: state.isAdminAuthenticated
      })
    }
  )
)
