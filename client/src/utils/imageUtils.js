// Image utility functions

/**
 * Get the correct backend server URL for images
 */
export const getBackendUrl = () => {
  return import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:5000'
}

/**
 * Convert relative image URL to absolute backend URL
 * @param {string} imageUrl - The image URL (could be relative or absolute)
 * @returns {string} - Absolute URL pointing to backend server
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null
  
  // If already absolute URL, return as is
  if (imageUrl.startsWith('http')) {
    return imageUrl
  }
  
  // If relative URL, prepend backend server URL
  const backendUrl = getBackendUrl()
  return `${backendUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`
}

/**
 * Generate a local placeholder image as data URL
 * @param {string} text - Text to display in placeholder
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} bgColor - Background color (hex)
 * @param {string} textColor - Text color (hex)
 * @returns {string} - Data URL for the placeholder image
 */
export const generatePlaceholderImage = (
  text = 'Product Image',
  width = 400,
  height = 400,
  bgColor = '#6366f1',
  textColor = '#ffffff'
) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  
  const ctx = canvas.getContext('2d')
  
  // Fill background
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)
  
  // Add text
  ctx.fillStyle = textColor
  ctx.font = `${Math.min(width, height) / 10}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // Split text into lines if too long
  const maxWidth = width * 0.8
  const words = text.split(' ')
  const lines = []
  let currentLine = words[0]
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const width = ctx.measureText(currentLine + ' ' + word).width
    if (width < maxWidth) {
      currentLine += ' ' + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  lines.push(currentLine)
  
  // Draw lines
  const lineHeight = Math.min(width, height) / 8
  const startY = height / 2 - (lines.length - 1) * lineHeight / 2
  
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight)
  })
  
  return canvas.toDataURL()
}

/**
 * Get fallback image URL (local placeholder)
 * @param {string} text - Text for placeholder
 * @returns {string} - Data URL for fallback image
 */
export const getFallbackImageUrl = (text = 'Product Image') => {
  return generatePlaceholderImage(text)
}

/**
 * Create an error handler for image elements
 * @param {string} fallbackText - Text to show in fallback image
 * @param {number} width - Canvas width for fallback
 * @param {number} height - Canvas height for fallback
 * @returns {Function} - Error handler function
 */
export const createImageErrorHandler = (fallbackText = 'Product Image', width = 400, height = 400) => {
  return (e) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#6366f1'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#ffffff'
    ctx.font = `${Math.min(width, height) / 15}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(fallbackText, width / 2, height / 2)
    e.target.src = canvas.toDataURL()
  }
}