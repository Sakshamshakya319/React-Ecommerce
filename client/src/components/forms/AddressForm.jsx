import React, { useState, useEffect } from 'react'
import { MapPin, Search, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import Button from '../ui/Button'
import { apiClient } from '../../api/client'
import toast from 'react-hot-toast'

const AddressForm = ({ 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  title = "Address Information" 
}) => {
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    ...initialData
  })
  
  const [pincodeStatus, setPincodeStatus] = useState('idle') // idle, loading, success, error
  const [pincodeMessage, setPincodeMessage] = useState('')
  const [isAutoFilled, setIsAutoFilled] = useState(false)

  // Debounce pincode lookup
  useEffect(() => {
    if (formData.zipCode && formData.zipCode.length === 6 && /^\d{6}$/.test(formData.zipCode)) {
      const timeoutId = setTimeout(() => {
        fetchPincodeData(formData.zipCode)
      }, 500) // 500ms delay

      return () => clearTimeout(timeoutId)
    } else if (formData.zipCode && formData.zipCode.length > 0) {
      setPincodeStatus('idle')
      setPincodeMessage('')
      setIsAutoFilled(false)
    }
  }, [formData.zipCode])

  const fetchPincodeData = async (pincode) => {
    setPincodeStatus('loading')
    setPincodeMessage('Looking up pincode...')
    
    try {
      console.log('Fetching data for pincode:', pincode)
      
      const response = await apiClient.get(`/pincode/${pincode}`)
      
      if (response.data.success) {
        const locationData = response.data.data
        
        // Auto-fill city, state, and country
        setFormData(prev => ({
          ...prev,
          city: locationData.city,
          state: locationData.state,
          country: locationData.country
        }))
        
        setPincodeStatus('success')
        setPincodeMessage(`Found: ${locationData.city}, ${locationData.state}`)
        setIsAutoFilled(true)
        
        toast.success(`Address auto-filled for ${locationData.city}, ${locationData.state}`)
      }
    } catch (error) {
      console.error('Pincode lookup failed:', error)
      
      setPincodeStatus('error')
      
      if (error.response?.status === 404) {
        setPincodeMessage('Pincode not found. Please check and try again.')
      } else if (error.response?.status === 400) {
        setPincodeMessage('Invalid pincode format. Please enter a 6-digit pincode.')
      } else if (error.response?.status === 408) {
        setPincodeMessage('Request timeout. Please try again.')
      } else {
        setPincodeMessage('Unable to fetch location data. Please enter manually.')
      }
      
      // Don't clear the fields, let user enter manually
      setIsAutoFilled(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // If user manually changes city or state after auto-fill, mark as not auto-filled
    if ((name === 'city' || name === 'state') && isAutoFilled) {
      setIsAutoFilled(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate required fields
    const requiredFields = ['street', 'city', 'state', 'zipCode']
    const missingFields = requiredFields.filter(field => !formData[field]?.trim())
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate pincode format for India
    if (!/^\d{6}$/.test(formData.zipCode)) {
      toast.error('Please enter a valid 6-digit pincode')
      return
    }

    onSubmit({ ...formData, country: 'India' })
  }

  const getPincodeStatusIcon = () => {
    switch (pincodeStatus) {
      case 'loading':
        return <Loader className="h-4 w-4 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <MapPin className="h-4 w-4 text-gray-400" />
    }
  }

  const getPincodeStatusColor = () => {
    switch (pincodeStatus) {
      case 'loading':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-6">
        <MapPin className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Street Address */}
        <div>
          <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
            Street Address *
          </label>
          <input
            type="text"
            id="street"
            name="street"
            required
            value={formData.street}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="House No., Street Name, Area"
          />
        </div>

        {/* Pincode with Auto-lookup */}
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
            Pincode *
          </label>
          <div className="relative">
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              required
              maxLength={6}
              value={formData.zipCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="110001"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {getPincodeStatusIcon()}
            </div>
          </div>
          
          {/* Pincode Status Message */}
          {pincodeMessage && (
            <div className={`mt-1 text-sm ${getPincodeStatusColor()}`}>
              {pincodeMessage}
            </div>
          )}
          
          {/* Auto-fill indicator */}
          {isAutoFilled && (
            <div className="mt-1 text-xs text-green-600 flex items-center space-x-1">
              <CheckCircle className="h-3 w-3" />
              <span>City and state auto-filled from pincode</span>
            </div>
          )}
        </div>

        {/* City and State in a row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              required
              value={formData.city}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                isAutoFilled ? 'bg-green-50 border-green-300' : ''
              }`}
              placeholder="Mumbai"
            />
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              id="state"
              name="state"
              required
              value={formData.state}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                isAutoFilled ? 'bg-green-50 border-green-300' : ''
              }`}
              placeholder="Maharashtra"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Save Address
          </Button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <Search className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Auto-fill feature:</p>
            <p>Enter your 6-digit pincode and we'll automatically fill in your city and state information.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddressForm