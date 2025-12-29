const express = require('express')
const axios = require('axios')

const router = express.Router()

// @route   GET /api/pincode/:pincode
// @desc    Get city and state information from Indian pincode
// @access  Public
router.get('/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params

    console.log('=== PINCODE LOOKUP START ===')
    console.log('Pincode:', pincode)

    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode format. Please enter a 6-digit pincode.'
      })
    }

    // Call Indian Postal API
    const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'E-commerce-App/1.0'
      }
    })

    console.log('API Response Status:', response.status)
    console.log('API Response Data:', JSON.stringify(response.data, null, 2))

    // Check if API returned data
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found for this pincode'
      })
    }

    const pincodeData = response.data[0]

    // Check if the pincode was found
    if (pincodeData.Status !== 'Success') {
      return res.status(404).json({
        success: false,
        message: pincodeData.Message || 'Pincode not found'
      })
    }

    // Extract post office data
    const postOffices = pincodeData.PostOffice
    if (!postOffices || postOffices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No post office data found for this pincode'
      })
    }

    // Get the first post office data (usually the main one)
    const mainPostOffice = postOffices[0]

    // Extract location information
    const locationData = {
      pincode: pincode,
      city: mainPostOffice.District || mainPostOffice.Name,
      state: mainPostOffice.State,
      country: 'India',
      district: mainPostOffice.District,
      region: mainPostOffice.Region,
      division: mainPostOffice.Division,
      postOffices: postOffices.map(po => ({
        name: po.Name,
        type: po.BranchType,
        deliveryStatus: po.DeliveryStatus
      }))
    }

    console.log('Extracted location data:', locationData)
    console.log('=== PINCODE LOOKUP SUCCESS ===')

    res.status(200).json({
      success: true,
      message: 'Pincode data retrieved successfully',
      data: locationData
    })

  } catch (error) {
    console.log('=== PINCODE LOOKUP ERROR ===')
    console.error('Pincode lookup error:', error.message)
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: 'Request timeout. Please try again.'
      })
    }

    if (error.response) {
      console.error('API Error Status:', error.response.status)
      console.error('API Error Data:', error.response.data)
      
      return res.status(503).json({
        success: false,
        message: 'Postal service temporarily unavailable. Please try again later.'
      })
    }

    if (error.request) {
      return res.status(503).json({
        success: false,
        message: 'Unable to connect to postal service. Please check your internet connection.'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch pincode data'
    })
  }
})

// @route   GET /api/pincode/search/:query
// @desc    Search for pincodes by city/area name
// @access  Public
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params

    console.log('=== PINCODE SEARCH START ===')
    console.log('Search Query:', query)

    // Validate query
    if (!query || query.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 3 characters long'
      })
    }

    // Call Indian Postal API for post office search
    const response = await axios.get(`https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'E-commerce-App/1.0'
      }
    })

    console.log('Search API Response Status:', response.status)

    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found for this search'
      })
    }

    const searchData = response.data[0]

    if (searchData.Status !== 'Success') {
      return res.status(404).json({
        success: false,
        message: searchData.Message || 'No results found'
      })
    }

    const postOffices = searchData.PostOffice || []
    
    // Format search results
    const results = postOffices.map(po => ({
      name: po.Name,
      pincode: po.Pincode,
      district: po.District,
      state: po.State,
      region: po.Region,
      branchType: po.BranchType,
      deliveryStatus: po.DeliveryStatus
    }))

    console.log('Search results count:', results.length)
    console.log('=== PINCODE SEARCH SUCCESS ===')

    res.status(200).json({
      success: true,
      message: 'Search results retrieved successfully',
      data: {
        query: query,
        results: results,
        count: results.length
      }
    })

  } catch (error) {
    console.log('=== PINCODE SEARCH ERROR ===')
    console.error('Pincode search error:', error.message)
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: 'Search timeout. Please try again.'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to search pincodes'
    })
  }
})

module.exports = router