import React, { useState } from 'react'
import { Package } from 'lucide-react'
import { getImageUrl, getFallbackImageUrl } from '../../utils/imageUtils'

const Image = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = null,
  showPlaceholder = true,
  fallbackText,
  ...props 
}) => {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  // Get the correct image URL using backend server
  const imageUrl = getImageUrl(src)

  // If there's an error and no fallback, show placeholder
  if (imageError && !fallbackSrc && showPlaceholder) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`} {...props}>
        <div className="text-center">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <span className="text-xs text-gray-500">No Image</span>
        </div>
      </div>
    )
  }

  // Determine final image source
  let finalSrc = imageUrl
  if (imageError) {
    if (fallbackSrc) {
      finalSrc = fallbackSrc
    } else {
      finalSrc = getFallbackImageUrl(fallbackText || alt || 'Product Image')
    }
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="text-xs text-gray-500">Loading...</div>
        </div>
      )}
      <img
        src={finalSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        {...props}
      />
    </div>
  )
}

export default Image