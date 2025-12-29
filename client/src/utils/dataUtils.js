/**
 * Utility functions for safely handling data rendering
 */

/**
 * Safely get review count from product data
 * @param {Object} product - Product object
 * @returns {number} - Review count
 */
export const getReviewCount = (product) => {
  if (!product) return 0
  
  // If reviews is a number, return it
  if (typeof product.reviews === 'number') {
    return product.reviews
  }
  
  // If reviews is an array, return its length
  if (Array.isArray(product.reviews)) {
    return product.reviews.length
  }
  
  // If reviews is an object with a count property
  if (product.reviews && typeof product.reviews === 'object' && product.reviews.count) {
    return product.reviews.count
  }
  
  // Default to 0
  return 0
}

/**
 * Safely render any value, preventing objects from being rendered directly
 * @param {any} value - Value to render
 * @returns {string|number} - Safe value for rendering
 */
export const safeRender = (value) => {
  if (value === null || value === undefined) {
    return ''
  }
  
  if (typeof value === 'object') {
    // If it's an array, join with commas
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    
    // If it's an object, return JSON string or empty string
    try {
      return JSON.stringify(value)
    } catch {
      return '[Object]'
    }
  }
  
  return value
}

/**
 * Safely get product rating
 * @param {Object} product - Product object
 * @returns {number} - Rating value
 */
export const getProductRating = (product) => {
  if (!product) return 0
  
  if (typeof product.rating === 'number') {
    return product.rating
  }
  
  // If rating is an object with average property
  if (product.rating && typeof product.rating === 'object' && product.rating.average) {
    return product.rating.average
  }
  
  return 4.5 // Default rating
}

/**
 * Clean product data to prevent rendering issues
 * @param {Object} product - Product object
 * @returns {Object} - Cleaned product object
 */
export const cleanProductData = (product) => {
  if (!product) return {}
  
  const cleaned = { ...product }
  
  // Ensure reviews is a number
  cleaned.reviews = getReviewCount(product)
  
  // Ensure rating is a number
  cleaned.rating = getProductRating(product)
  
  // Clean any nested objects that might cause issues
  if (cleaned.user && typeof cleaned.user === 'object') {
    // If there's a user object, extract safe properties
    cleaned.user = {
      displayName: cleaned.user.displayName || 'Anonymous',
      _id: cleaned.user._id || ''
    }
  }
  
  // Remove any review objects that might be accidentally included
  if (Array.isArray(cleaned.reviewObjects)) {
    delete cleaned.reviewObjects
  }
  
  // Ensure all string fields are actually strings
  if (cleaned.name && typeof cleaned.name !== 'string') {
    cleaned.name = String(cleaned.name)
  }
  
  if (cleaned.description && typeof cleaned.description !== 'string') {
    cleaned.description = String(cleaned.description)
  }
  
  return cleaned
}