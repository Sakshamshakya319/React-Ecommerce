import React from 'react'

/**
 * SafeRender component that prevents objects from being rendered directly
 * Catches any remaining object rendering issues and displays them safely
 */
const SafeRender = ({ children, fallback = '' }) => {
  try {
    // If children is an object, don't render it
    if (typeof children === 'object' && children !== null && !React.isValidElement(children)) {
      console.warn('SafeRender: Attempted to render object directly:', children)
      return fallback
    }
    
    return children
  } catch (error) {
    console.error('SafeRender: Error rendering children:', error)
    return fallback
  }
}

export default SafeRender