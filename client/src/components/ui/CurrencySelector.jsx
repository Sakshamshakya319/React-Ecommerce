import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useCurrencyStore } from '../../store/currencyStore'

const CurrencySelector = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  const {
    currentCurrency,
    setCurrency,
    getCurrentCurrency,
    getAllCurrencies
  } = useCurrencyStore()
  
  const currentCurrencyInfo = getCurrentCurrency()
  const allCurrencies = getAllCurrencies()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCurrencySelect = (currencyCode) => {
    setCurrency(currencyCode)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Currency Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      >
        <span className="text-lg">{currentCurrencyInfo.flag}</span>
        <span className="font-medium text-gray-700">{currentCurrencyInfo.code}</span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="py-1">
            {allCurrencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleCurrencySelect(currency.code)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  currentCurrency === currency.code ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{currency.flag}</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {currency.code}
                    </div>
                    <div className="text-sm text-gray-500">
                      {currency.name}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">
                    {currency.symbol}
                  </span>
                  {currentCurrency === currency.code && (
                    <Check className="h-4 w-4 text-primary-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {/* Exchange Rate Info */}
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
            <p className="text-xs text-gray-500">
              Prices are converted from INR (Indian Rupee) base currency.
              Exchange rates are approximate and for display purposes only.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CurrencySelector