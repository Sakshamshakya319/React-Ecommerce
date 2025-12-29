// Utility functions for handling images in the application

/**
 * Get a reliable image URL with fallback
 * @param {string} imageUrl - The original image URL
 * @param {string} fallback - Fallback image path (default: placeholder)
 * @returns {string} - Reliable image URL
 */
export const getReliableImageUrl = (imageUrl, fallback = '/placeholder-product.svg') => {
  if (!imageUrl) return fallback
  
  // If it's already a data URL or external URL, return as is
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
    return imageUrl
  }
  
  // For local images, ensure they start with /
  if (!imageUrl.startsWith('/')) {
    return `/${imageUrl}`
  }
  
  return imageUrl
}

// Alias for backward compatibility
export const getImageUrl = getReliableImageUrl

// Another alias for fallback functionality
export const getFallbackImageUrl = (imageUrl, fallback = '/placeholder-product.svg') => {
  return getReliableImageUrl(imageUrl, fallback)
}

/**
 * Handle image load error with fallback
 * @param {Event} event - The error event
 * @param {string} fallback - Fallback image path
 */
export const handleImageError = (event, fallback = '/placeholder-product.svg') => {
  const img = event.target
  
  // Prevent infinite loop if fallback also fails
  if (img.src.includes('placeholder') || img.src.startsWith('data:')) {
    // Use inline SVG as final fallback
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb2R1Y3QgSW1hZ2U8L3RleHQ+PC9zdmc+'
    return
  }
  
  // Try fallback image
  img.src = fallback
}

// Alias for backward compatibility
export const createImageErrorHandler = (fallback) => (event) => handleImageError(event, fallback)

/**
 * Preload an image to check if it exists
 * @param {string} src - Image source URL
 * @returns {Promise<boolean>} - Promise that resolves to true if image loads
 */
export const preloadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

/**
 * Get optimized image URL for different sizes
 * @param {string} imageUrl - Original image URL
 * @param {string} size - Size variant (thumbnail, medium, large)
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = (imageUrl, size = 'medium') => {
  if (!imageUrl || imageUrl.startsWith('data:')) return imageUrl
  
  // For external URLs, return as is
  if (imageUrl.startsWith('http')) return imageUrl
  
  // For local images, you could implement size variants here
  // For now, just return the original
  return getReliableImageUrl(imageUrl)
}