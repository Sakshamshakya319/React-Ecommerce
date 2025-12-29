const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  console.error('Error:', err)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = {
      message,
      statusCode: 404
    }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
    error = {
      message,
      statusCode: 400
    }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = {
      message,
      statusCode: 400
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = {
      message,
      statusCode: 401
    }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = {
      message,
      statusCode: 401
    }
  }

  // Firebase errors
  if (err.code && err.code.startsWith('auth/')) {
    let message = 'Authentication error'
    
    switch (err.code) {
      case 'auth/user-not-found':
        message = 'User not found'
        break
      case 'auth/wrong-password':
        message = 'Invalid credentials'
        break
      case 'auth/email-already-in-use':
        message = 'Email already registered'
        break
      case 'auth/weak-password':
        message = 'Password is too weak'
        break
      case 'auth/invalid-email':
        message = 'Invalid email address'
        break
      case 'auth/too-many-requests':
        message = 'Too many requests. Please try again later'
        break
      default:
        message = err.message || 'Authentication error'
    }
    
    error = {
      message,
      statusCode: 400
    }
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large'
    error = {
      message,
      statusCode: 400
    }
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field'
    error = {
      message,
      statusCode: 400
    }
  }

  // Default error
  const statusCode = error.statusCode || err.statusCode || 500
  const message = error.message || 'Internal server error'

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  })
}

module.exports = {
  errorHandler
}