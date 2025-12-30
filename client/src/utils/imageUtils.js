// Image utility functions for handling product images across the application

/**
 * Get the base API URL for the current environment
 */
export const getApiBaseUrl = () => {
  // In production, use the deployed backend URL
  if (import.meta.env.PROD) {
    return 'https://react-ecommerce-qn3a.onrender.com'
  }
  
  // In development, use environment variable or fallback to localhost
  return import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
}

/**
 * Generate proper image URL from various image path formats
 * @param {string|object} image - Image path string or image object with url property
 * @param {string} fallbackText - Text to show in placeholder if image fails
 * @returns {string} - Properly formatted image URL
 */
export const getImageUrl = (image, fallbackText = 'Product Image') => {
  if (!image) {
    return getPlaceholderImageUrl(fallbackText)
  }

  let imagePath = ''
  
  // Handle different image formats
  if (typeof image === 'string') {
    imagePath = image
  } else if (image && typeof image === 'object') {
    imagePath = image.url || image.path || image.src || ''
  }

  if (!imagePath) {
    return getPlaceholderImageUrl(fallbackText)
  }

  // If it's already a full URL (starts with http), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // If it's a relative path starting with /uploads, construct full URL
  if (imagePath.startsWith('/uploads/')) {
    return `${getApiBaseUrl()}${imagePath}`
  }

  // If it's just a filename or relative path, assume it's in uploads/products
  if (!imagePath.startsWith('/')) {
    return `${getApiBaseUrl()}/uploads/products/${imagePath}`
  }

  // Default case - prepend base URL
  return `${getApiBaseUrl()}${imagePath}`
}

/**
 * Generate placeholder image URL
 * @param {string} text - Text to display in placeholder
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} - Placeholder image URL
 */
export const getPlaceholderImageUrl = (text = 'Product Image', width = 400, height = 400) => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/upload/placeholder/product-image?width=${width}&height=${height}&text=${encodeURIComponent(text)}`
}

/**
 * Create an error handler for image loading failures
 * @param {string} fallbackText - Text for placeholder
 * @returns {function} - Error handler function
 */
export const createImageErrorHandler = (fallbackText = 'Product Image') => {
  return (event) => {
    const img = event.target
    const placeholder = getPlaceholderImageUrl(fallbackText, img.width || 400, img.height || 400)
    
    // Prevent infinite loop if placeholder also fails
    if (img.src !== placeholder) {
      img.src = placeholder
    }
  }
}

/**
 * Preload image and return promise
 * @param {string} src - Image source URL
 * @returns {Promise} - Promise that resolves when image loads
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Get optimized image URL with size parameters (if supported by backend)
 * @param {string|object} image - Image path or object
 * @param {number} width - Desired width
 * @param {number} height - Desired height
 * @param {string} quality - Image quality (low, medium, high)
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = (image, width, height, quality = 'medium') => {
  const baseUrl = getImageUrl(image)
  
  // If it's a placeholder, return as is
  if (baseUrl.includes('placeholder')) {
    return baseUrl
  }
  
  // For now, return the base URL (can be extended for image optimization service)
  return baseUrl
}

/**
 * Validate image file before upload
 * @param {File} file - File object
 * @returns {object} - Validation result with isValid and error
 */
export const validateImageFile = (file) => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  
  if (!file) {
    return { isValid: false, error: 'No file selected' }
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.' }
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large. Please select an image under 5MB.' }
  }
  
  return { isValid: true, error: null }
}

/**
 * Convert image file to base64 for preview
 * @param {File} file - Image file
 * @returns {Promise<string>} - Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Export default object with all functions
export default {
  getApiBaseUrl,
  getImageUrl,
  getPlaceholderImageUrl,
  createImageErrorHandler,
  preloadImage,
  getOptimizedImageUrl,
  validateImageFile,
  fileToBase64
}