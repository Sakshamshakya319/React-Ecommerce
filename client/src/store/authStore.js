import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../config/firebase'
import { apiClient } from '../api/client'
import toast from 'react-hot-toast'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: true,
      accessToken: null,

      // Actions
      initializeAuth: async () => {
        try {
          // Listen for Firebase auth state changes
          onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              // Get Firebase ID token
              const idToken = await firebaseUser.getIdToken()
              
              // Send to backend for JWT creation
              try {
                const response = await apiClient.post('/auth/firebase-login', {
                  idToken,
                  firebaseUser: {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    phoneNumber: firebaseUser.phoneNumber
                  }
                })

                const { user, accessToken } = response.data
                
                set({
                  user,
                  isAuthenticated: true,
                  accessToken,
                  isLoading: false
                })
              } catch (error) {
                console.error('Backend authentication failed:', error)
                set({ isLoading: false })
              }
            } else {
              set({
                user: null,
                isAuthenticated: false,
                accessToken: null,
                isLoading: false
              })
            }
          })
        } catch (error) {
          console.error('Auth initialization failed:', error)
          set({ isLoading: false })
        }
      },

      // Email/Password Login
      loginWithEmail: async (email, password) => {
        try {
          set({ isLoading: true })
          const userCredential = await signInWithEmailAndPassword(auth, email, password)
          toast.success('Login successful!')
          return userCredential.user
        } catch (error) {
          console.error('Login error:', error)
          toast.error(error.message || 'Login failed')
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // Email/Password Registration
      registerWithEmail: async (email, password, displayName, phoneNumber) => {
        try {
          set({ isLoading: true })
          
          // Create Firebase user
          const userCredential = await createUserWithEmailAndPassword(auth, email, password)
          const user = userCredential.user

          // Update Firebase profile
          await updateProfile(user, {
            displayName: displayName
          })

          // Create user document in Firestore
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            phoneNumber: phoneNumber || '',
            photoURL: user.photoURL || '',
            role: 'user',
            customerId: `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })

          toast.success('Registration successful!')
          return user
        } catch (error) {
          console.error('Registration error:', error)
          toast.error(error.message || 'Registration failed')
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // Google Login
      loginWithGoogle: async () => {
        try {
          set({ isLoading: true })
          const result = await signInWithPopup(auth, googleProvider)
          const user = result.user

          // Check if user document exists, create if not
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              phoneNumber: user.phoneNumber || '',
              photoURL: user.photoURL || '',
              role: 'user',
              customerId: `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          }

          toast.success('Google login successful!')
          return user
        } catch (error) {
          console.error('Google login error:', error)
          toast.error(error.message || 'Google login failed')
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // Update Profile
      updateProfile: async (profileData) => {
        try {
          const { user } = get()
          if (!user) throw new Error('No user logged in')

          set({ isLoading: true })

          // Update Firebase profile
          if (profileData.displayName) {
            await updateProfile(auth.currentUser, {
              displayName: profileData.displayName
            })
          }

          // Update Firestore document
          await updateDoc(doc(db, 'users', user.uid), {
            ...profileData,
            updatedAt: new Date().toISOString()
          })

          // Update local state
          set({
            user: {
              ...user,
              ...profileData
            }
          })

          toast.success('Profile updated successfully!')
        } catch (error) {
          console.error('Profile update error:', error)
          toast.error(error.message || 'Profile update failed')
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // Logout
      logout: async () => {
        try {
          await signOut(auth)
          
          // Clear backend session
          try {
            await apiClient.post('/auth/logout')
          } catch (error) {
            console.error('Backend logout error:', error)
          }

          set({
            user: null,
            isAuthenticated: false,
            accessToken: null
          })

          toast.success('Logged out successfully!')
        } catch (error) {
          console.error('Logout error:', error)
          toast.error('Logout failed')
        }
      },

      // Get current user data
      getCurrentUser: async () => {
        try {
          const { user } = get()
          if (!user) return null

          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            set({
              user: {
                ...user,
                ...userData
              }
            })
            return userData
          }
          return null
        } catch (error) {
          console.error('Get current user error:', error)
          return null
        }
      },

      // Set access token (for token refresh)
      setAccessToken: (token) => {
        set({ accessToken: token })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)