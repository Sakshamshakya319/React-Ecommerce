import React, { useState, useEffect } from 'react'
import { MapPin, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import Button from '../ui/Button'
import { apiClient } from '../../api/client'
import toast from 'react-hot-toast'

const IndianShippingForm = ({ 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  title = "Shipping Address" 
}) => {
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
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
      }, 500)

      return () => clearTimeout(timeoutId)
    } else if (formData.zipCode && formData.zipCode.length > 0) {
      setPincodeStatus('idle')
      setPincodeMessage('')
      setIsAutoFilled(false)
      // Clear city and state when pincode is invalid
      setFormData(prev => ({
        ...prev,
        city: '',
        state: ''
      }))
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
        
        // Auto-fill and lock city and state
        setFormData(prev => ({
          ...prev,
          city: locationData.city,
          state: locationData.state
        }))
        
        setPincodeStatus('success')
        setPincodeMessage(`${locationData.city}, ${locationData.state}`)
        setIsAutoFilled(true)
        
        toast.success(`Address auto-filled: ${locationData.city}, ${locationData.state}`)
      }
    } catch (error) {
      console.error('Pincode lookup failed:', error)
      
      setPincodeStatus('error')
      setIsAutoFilled(false)
      
      // Allow manual entry when lookup fails
      setFormData(prev => ({
        ...prev,
        city: prev.city || '',
        state: prev.state || ''
      }))
      
      if (error.response?.status === 404) {
        setPincodeMessage('Pincode not found. Please check and try again.')
      } else if (error.response?.status === 400) {
        setPincodeMessage('Invalid pincode format. Please enter a 6-digit pincode.')
      } else if (error.response?.status === 408) {
        setPincodeMessage('Request timeout. Please try again.')
      } else {
        setPincodeMessage('Unable to fetch location data. Please try again.')
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Allow manual changes when not auto-filled
    if (
      name === 'street' || 
      name === 'zipCode' || 
      (pincodeStatus === 'error' && (name === 'city' || name === 'state'))
    ) {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'zipCode' ? value.replace(/\D/g, '').slice(0, 6) : value
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.street?.trim()) {
      toast.error('Please enter street address')
      return
    }

    if (!formData.zipCode || formData.zipCode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode')
      return
    }

    if (!formData.city?.trim() || !formData.state?.trim()) {
      toast.error('Please provide city and state (auto-filled or manual)')
      return
    }

    // Add country as India by default
    const addressData = {
      ...formData,
      country: 'India'
    }

    onSubmit(addressData)
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
            placeholder="House/Flat No., Building Name, Street Name, Area"
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
              placeholder="Enter 6-digit pincode (e.g., 110001)"
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
        </div>

        {/* City and State - Auto-filled and Locked */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City - Read Only */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <div className="relative">
              <input
                type="text"
                id="city"
                name="city"
                required
                value={formData.city}
                readOnly={pincodeStatus !== 'error'}
                className={`w-full px-3 py-2 pr-10 border rounded-lg ${
                  pincodeStatus === 'success'
                    ? 'bg-green-50 border-green-300 text-green-800 cursor-not-allowed' 
                    : pincodeStatus === 'error'
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                placeholder={pincodeStatus === 'error' ? 'Enter city manually' : 'Auto-filled from pincode'}
              />
              {pincodeStatus === 'success' && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Lock className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>
            {pincodeStatus === 'success' && (
              <div className="mt-1 text-xs text-green-600 flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Auto-filled and locked</span>
              </div>
            )}
          </div>

          {/* State - Read Only */}
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <div className="relative">
              <input
                type="text"
                id="state"
                name="state"
                required
                value={formData.state}
                readOnly={pincodeStatus !== 'error'}
                className={`w-full px-3 py-2 pr-10 border rounded-lg ${
                  pincodeStatus === 'success'
                    ? 'bg-green-50 border-green-300 text-green-800 cursor-not-allowed' 
                    : pincodeStatus === 'error'
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                placeholder={pincodeStatus === 'error' ? 'Enter state manually' : 'Auto-filled from pincode'}
              />
              {pincodeStatus === 'success' && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Lock className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>
            {pincodeStatus === 'success' && (
              <div className="mt-1 text-xs text-green-600 flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Auto-filled and locked</span>
              </div>
            )}
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
            disabled={isLoading || !(isAutoFilled || pincodeStatus === 'error')}
          >
            Save Address
          </Button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">How it works:</p>
            <p>Enter your 6-digit pincode and we'll automatically fill and lock your city and state. This ensures accurate delivery within India.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndianShippingForm
