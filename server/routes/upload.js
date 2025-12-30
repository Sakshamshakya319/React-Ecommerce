const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { verifyAnyToken } = require('../middleware/auth')

const router = express.Router()

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/products')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `product-${uniqueSuffix}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)
  
  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'))
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
})

// @route   POST /api/upload/image
// @desc    Upload single image
// @access  Private (Admin/Seller)
router.post('/image', verifyAnyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded'
      })
    }

    // Store relative path for consistency across environments
    const relativePath = `/uploads/products/${req.file.filename}`

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      url: relativePath, // Store relative path
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    })

  } catch (error) {
    console.error('Single image upload error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    })
  }
})

// @route   POST /api/upload/product-images
// @desc    Upload product images
// @access  Private (Admin/Seller)
router.post('/product-images', verifyAnyToken, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      })
    }

    // Process uploaded files with relative paths
    const imageUrls = req.files.map(file => ({
      url: `/uploads/products/${file.filename}`, // Store relative path
      filename: file.filename,
      originalName: file.originalname,
      size: file.size
    }))

    res.status(200).json({
      success: true,
      message: `${req.files.length} image(s) uploaded successfully`,
      images: imageUrls
    })

  } catch (error) {
    console.error('Image upload error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload images'
    })
  }
})

// @route   DELETE /api/upload/product-images/:filename
// @desc    Delete uploaded image
// @access  Private (Admin/Seller)
router.delete('/product-images/:filename', verifyAnyToken, async (req, res) => {
  try {
    const { filename } = req.params
    const filePath = path.join(uploadsDir, filename)

    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      })
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found'
      })
    }

  } catch (error) {
    console.error('Image delete error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    })
  }
})

// @route   GET /api/upload/placeholder/product-image
// @desc    Generate placeholder image
// @access  Public
router.get('/placeholder/product-image', (req, res) => {
  const { width = 400, height = 400, text = 'Product Image' } = req.query
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#7c3aed" stroke-width="0.5" opacity="0.1"/>
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="#6366f1"/>
      <rect width="${width}" height="${height}" fill="url(#grid)"/>
      <circle cx="${width/2}" cy="${height/2 - 30}" r="40" fill="white" opacity="0.2"/>
      <rect x="${width/2 - 25}" y="${height/2 - 20}" width="50" height="30" rx="5" fill="white" opacity="0.3"/>
      <text x="${width/2}" y="${height/2 + 40}" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" opacity="0.8">${text}</text>
    </svg>
  `
  
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 1 day
  res.setHeader('Access-Control-Allow-Origin', '*') // Allow CORS for images
  res.send(svg)
})

module.exports = router
