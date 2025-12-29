import React from 'react'
import { useCurrencyStore } from '../../store/currencyStore'

const Price = ({ 
  amount, 
  className = '', 
  showOriginal = false,
  size = 'base' 
}) => {
  const { formatPrice, getCurrentCurrency, convertPrice } = useCurrencyStore()
  const currentCurrency = getCurrentCurrency()
  
  // Ensure amount is a valid number
  const numericAmount = parseFloat(amount) || 0
  
  if (numericAmount === 0) {
    return <span className={`text-gray-400 ${className}`}>Price not available</span>
  }

  const formattedPrice = formatPrice(numericAmount)
  const convertedAmount = convertPrice(numericAmount)
  
  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <span className="font-semibold text-gray-900 dark:text-white">
        {formattedPrice}
      </span>
      
      {/* Show original INR price if currency is not INR */}
      {showOriginal && currentCurrency.code !== 'INR' && (
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 line-through">
          ₹{numericAmount.toFixed(2)}
        </span>
      )}
      
      {/* Show conversion rate info on hover */}
      {currentCurrency.code !== 'INR' && (
        <span 
          className="ml-1 text-xs text-gray-400 dark:text-gray-500 cursor-help" 
          title={`Original: ₹${numericAmount.toFixed(2)} INR\nConverted: ${formattedPrice}\nRate: 1 INR = ${currentCurrency.rate} ${currentCurrency.code}`}
        >
          *
        </span>
      )}
    </div>
  )
}

export default Price