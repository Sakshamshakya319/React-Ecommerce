const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const compression = require('compression')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit = require('express-rate-limit')
const path = require('path')
require('dotenv').config()

// Import routes
console.log('Loading routes...')
const authRoutes = require('./routes/auth')
console.log('✓ Auth routes loaded')
const userRoutes = require('./routes/users')
console.log('✓ User routes loaded')
const productRoutes = require('./routes/products')
console.log('✓ Product routes loaded')
const cartRoutes = require('./routes/cart')
console.log('✓ Cart routes loaded')
const orderRoutes = require('./routes/orders')
console.log('✓ Order routes loaded')
const adminRoutes = require('./routes/admin')
console.log('✓ Admin routes loaded')
const sellerRoutes = require('./routes/seller')
console.log('✓ Seller routes loaded')
const uploadRoutes = require('./routes/upload')
console.log('✓ Upload routes loaded')
const reviewRoutes = require('./routes/reviews')
console.log('✓ Review routes loaded')
const simpleReviewRoutes = require('./routes/simple-reviews')
console.log('✓ Simple review routes loaded')
const pincodeRoutes = require('./routes/pincode')
console.log('✓ Pincode routes loaded')
const unifiedAuthRoutes = require('./routes/unifiedAuth')
console.log('✓ Unified auth routes loaded')

// Import middleware
const { errorHandler } = require('./middleware/errorHandler')
const { notFound } = require('./middleware/notFound')

// Initialize Firebase Admin
require('./config/firebase')

const app = express()

// Trust proxy for rate limiting
app.set('trust proxy', 1)

// CORS configuration - Temporary fix for deployment
app.use(cors({
  origin: true, // Allow all origins temporarily
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limit each IP to 1000 requests per windowMs
//   message: {
//     error: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// })

// Apply rate limiting to all requests
// app.use(limiter)

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Compression middleware
app.use(compression())

// Data sanitization against NoSQL query injection
app.use(mongoSanitize())

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '3D E-commerce API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      admin: '/api/admin'
    }
  })
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API routes
console.log('Mounting API routes...')
app.use('/api/auth', authRoutes)
console.log('✓ Auth routes mounted at /api/auth')
app.use('/api/users', userRoutes)
console.log('✓ User routes mounted at /api/users')
app.use('/api/products', productRoutes)
console.log('✓ Product routes mounted at /api/products')
app.use('/api/cart', cartRoutes)
console.log('✓ Cart routes mounted at /api/cart')
app.use('/api/orders', orderRoutes)
console.log('✓ Order routes mounted at /api/orders')
app.use('/api/admin', adminRoutes)
console.log('✓ Admin routes mounted at /api/admin')
app.use('/api/seller', sellerRoutes)
console.log('✓ Seller routes mounted at /api/seller')
app.use('/api/upload', uploadRoutes)
console.log('✓ Upload routes mounted at /api/upload')
app.use('/api/reviews', reviewRoutes)
console.log('✓ Review routes mounted at /api/reviews')
app.use('/api/simple-reviews', simpleReviewRoutes)
console.log('✓ Simple review routes mounted at /api/simple-reviews')
app.use('/api/pincode', pincodeRoutes)
console.log('✓ Pincode routes mounted at /api/pincode')
app.use('/api/unified-auth', unifiedAuthRoutes)
console.log('✓ Unified auth routes mounted at /api/unified-auth')
console.log('All API routes mounted successfully!')

// Placeholder image endpoint
app.get('/api/placeholder/:type', (req, res) => {
  const { type } = req.params
  const { width = 400, height = 400, text = 'Product Image' } = req.query
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#6366f1"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dy=".3em">
        ${text}
      </text>
    </svg>
  `
  
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 1 day
  res.send(svg)
})

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path, stat) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin')
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET')
    res.set('Access-Control-Allow-Headers', 'Content-Type')
  }
}))

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
  })
}

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('Database connection error:', error.message)
    process.exit(1)
  }
}

// Connect to database
connectDB()

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Unhandled Rejection: ${err.message}`)
  // Close server & exit process
  server.close(() => {
    process.exit(1)
  })
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Uncaught Exception: ${err.message}`)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  server.close(() => {
    console.log('Process terminated')
    mongoose.connection.close()
  })
})

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})

module.exports = app