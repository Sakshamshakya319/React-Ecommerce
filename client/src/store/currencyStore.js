import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Currency data with exchange rates (in a real app, fetch from API)
const CURRENCIES = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    rate: 1, // Base currency
    flag: '🇮🇳'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rate: 0.012, // 1 INR = 0.012 USD (approximate)
    flag: '🇺🇸'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rate: 0.011, // 1 INR = 0.011 EUR (approximate)
    flag: '🇪🇺'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rate: 0.0095, // 1 INR = 0.0095 GBP (approximate)
    flag: '🇬🇧'
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    rate: 1.8, // 1 INR = 1.8 JPY (approximate)
    flag: '🇯🇵'
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    rate: 0.018, // 1 INR = 0.018 AUD (approximate)
    flag: '🇦🇺'
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    rate: 0.017, // 1 INR = 0.017 CAD (approximate)
    flag: '🇨🇦'
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    rate: 0.016, // 1 INR = 0.016 SGD (approximate)
    flag: '🇸🇬'
  }
}

export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      // State
      currentCurrency: 'INR', // Default to Indian Rupee
      currencies: CURRENCIES,
      isLoading: false,

      // Actions
      
      // Set current currency
      setCurrency: (currencyCode) => {
        if (CURRENCIES[currencyCode]) {
          set({ currentCurrency: currencyCode })
        }
      },

      // Get current currency info
      getCurrentCurrency: () => {
        const { currentCurrency, currencies } = get()
        return currencies[currentCurrency]
      },

      // Convert price from INR to current currency
      convertPrice: (priceInINR) => {
        const { currentCurrency, currencies } = get()
        const currency = currencies[currentCurrency]
        
        if (!currency || !priceInINR) return 0
        
        const convertedPrice = priceInINR * currency.rate
        return Math.round(convertedPrice * 100) / 100 // Round to 2 decimal places
      },

      // Format price with currency symbol
      formatPrice: (priceInINR) => {
        const { convertPrice, getCurrentCurrency } = get()
        const currency = getCurrentCurrency()
        const convertedPrice = convertPrice(priceInINR)
        
        // Format based on currency
        if (currency.code === 'JPY') {
          // Japanese Yen doesn't use decimal places
          return `${currency.symbol}${Math.round(convertedPrice)}`
        }
        
        return `${currency.symbol}${convertedPrice.toFixed(2)}`
      },

      // Get all available currencies
      getAllCurrencies: () => {
        const { currencies } = get()
        return Object.values(currencies)
      },

      // Update exchange rates (in a real app, fetch from API)
      updateExchangeRates: async () => {
        try {
          set({ isLoading: true })
          
          // In a real application, you would fetch from a currency API
          // For now, we'll use static rates
          console.log('Exchange rates updated (using static rates)')
          
          set({ isLoading: false })
        } catch (error) {
          console.error('Failed to update exchange rates:', error)
          set({ isLoading: false })
        }
      }
    }),
    {
      name: 'currency-storage',
      partialize: (state) => ({
        currentCurrency: state.currentCurrency
      })
    }
  )
)