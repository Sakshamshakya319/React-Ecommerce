const express = require('express')
const router = express.Router()

// Simple test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth test route working',
    timestamp: new Date().toISOString()
  })
})

// Google login test route
router.post('/google-login', (req, res) => {
  res.json({
    success: true,
    message: 'Google login test endpoint working',
    body: req.body
  })
})

module.exports = router