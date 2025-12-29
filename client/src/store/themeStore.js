import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set, get) => ({
      // State
      theme: 'light', // 'light' | 'dark' | 'system'
      isDark: false,

      // Actions
      setTheme: (theme) => {
        console.log('Setting theme to:', theme) // Debug log
        set({ theme })
        get().applyTheme(theme)
      },

      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        console.log('Toggling theme from', currentTheme, 'to', newTheme) // Debug log
        get().setTheme(newTheme)
      },

      applyTheme: (theme) => {
        console.log('Applying theme:', theme) // Debug log
        const root = document.documentElement
        
        // Remove existing theme classes
        root.classList.remove('dark', 'light')
        
        if (theme === 'system') {
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          console.log('System prefers dark:', systemPrefersDark) // Debug log
          set({ isDark: systemPrefersDark })
          
          if (systemPrefersDark) {
            root.classList.add('dark')
          } else {
            root.classList.add('light')
          }
        } else {
          const isDark = theme === 'dark'
          console.log('Theme is dark:', isDark) // Debug log
          set({ isDark })
          
          if (isDark) {
            root.classList.add('dark')
          } else {
            root.classList.add('light')
          }
        }
        
        // Force a re-render by updating a timestamp
        set({ lastUpdated: Date.now() })
      },

      // Initialize theme on app start
      initializeTheme: () => {
        const { theme, applyTheme } = get()
        console.log('Initializing theme:', theme) // Debug log
        
        // Apply the current theme
        applyTheme(theme)
        
        // Listen for system theme changes if using system theme
        if (theme === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleChange = (e) => {
            console.log('System theme changed:', e.matches) // Debug log
            if (get().theme === 'system') {
              set({ isDark: e.matches })
              const root = document.documentElement
              root.classList.remove('dark', 'light')
              if (e.matches) {
                root.classList.add('dark')
              } else {
                root.classList.add('light')
              }
            }
          }
          
          mediaQuery.addEventListener('change', handleChange)
          
          // Cleanup function
          return () => mediaQuery.removeEventListener('change', handleChange)
        }
      }
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme
      })
    }
  )
)