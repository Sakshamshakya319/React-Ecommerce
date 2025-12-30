import React, { useState } from 'react'
import { MapPin, Truck, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import Button from '../ui/Button'
import { apiClient } from '../../api/client'
import toast from 'react-hot-toast'

const CheckoutAddressForm = ({ onAddressSubmit, isLoading = false }) => {
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: ''
  })

  const [billingAddress, setBillingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: ''
  })

  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [shippingPincodeStatus, setShippingPincodeStatus] = useState('idle')
  const [billingPincodeStatus, setBillingPincodeStatus] = useState('idle')
  const [shippingMessage, setShippingMessage] = useState('')
  const [billingMessage, setBillingMessage] = useState('')
  const [shippingAutoFilled, setShippingAutoFilled] = useState(false)
  const [billingAutoFilled, setBillingAutoFilled] = useState(false)

  // Debounce for shipping pincode
  React.useEffect(() => {
    if (shippingAddress.zipCode && shippingAddress.zipCode.length === 6 && /^\d{6}$/.test(shippingAddress.zipCode)) {
      const timeoutId = setTimeout(() => {
        fetchPincodeData(shippingAddress.zipCode, 'shipping')
      }, 500)
      return () => clearTimeout(timeoutId)
    } else if (shippingAddress.zipCode && shippingAddress.zipCode.length > 0) {
      setShippingPincodeStatus('idle')
      setShippingMessage('')
      setShippingAutoFilled(false)
      setShippingAddress(prev => ({ ...prev, city: '', state: '' }))
    }
  }, [shippingAddress.zipCode])

  // Debounce for billing pincode
  React.useEffect(() => {
    if (!sameAsShipping && billingAddress.zipCode && billingAddress.zipCode.length === 6 && /^\d{6}$/.test(billingAddress.zipCode)) {
      const timeoutId = setTimeout(() => {
        fetchPincodeData(billingAddress.zipCode, 'billing')
      }, 500)
      return () => clearTimeout(timeoutId)
    } else if (!sameAsShipping && billingAddress.zipCode && billingAddress.zipCode.length > 0) {
      setBillingPincodeStatus('idle')
      setBillingMessage('')
      setBillingAutoFilled(false)
      setBillingAddress(prev => ({ ...prev, city: '', state: '' }))
    }
  }, [billingAddress.zipCode, sameAsShipping])

  const fetchPincodeData = async (pincode, type) => {
    const setStatus = type === 'shipping' ? setShippingPincodeStatus : setBillingPincodeStatus
    const setMessage = type === 'shipping' ? setShippingMessage : setBillingMessage
    const setAutoFilled = type === 'shipping' ? setShippingAutoFilled : setBillingAutoFilled
    const setAddress = type === 'shipping' ? setShippingAddress : setBillingAddress
    
    setStatus('loading')
    setMessage('Looking up pincode...')
    
    try {
      const response = await apiClient.get(`/pincode/${pincode}`)
      
      if (response.data.success) {
        const locationData = response.data.data
        
        setAddress(prev => ({
          ...prev,
          city: locationData.city,
          state: locationData.state
        }))
        
        setStatus('success')
        setMessage(`${locationData.city}, ${locationData.state}`)
        setAutoFilled(true)
        
        toast.success(`${type === 'shipping' ? 'Shipping' : 'Billing'} address auto-filled: ${locationData.city}, ${locationData.state}`)
      }
    } catch (error) {
      setStatus('error')
      setAutoFilled(false)
      
      setAddress(prev => ({ ...prev, city: '', state: '' }))
      
      if (error.response?.status === 404) {
        setMessage('Pincode not found. Please check and try again.')
      } else if (error.response?.status === 400) {
        setMessage('Invalid pincode format.')
      } else {
        setMessage('Unable to fetch location data.')
      }
    }
  }

  const handleShippingChange = (field, value) => {
    if (field === 'street' || field === 'zipCode') {
      setShippingAddress(prev => ({
        ...prev,
        [field]: field === 'zipCode' ? value.replace(/\D/g, '').slice(0, 6) : value
      }))
    }
  }

  const handleBillingChange = (field, value) => {
    if (field === 'street' || field === 'zipCode') {
      setBillingAddress(prev => ({
        ...prev,
        [field]: field === 'zipCode' ? value.replace(/\D/g, '').slice(0, 6) : value
      }))
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
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

  const getStatusColor = (status) => {
    switch (status) {
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

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate shipping address
    if (!shippingAddress.street?.trim()) {
      toast.error('Please enter shipping street address')
      return
    }

    if (!shippingAddress.zipCode || shippingAddress.zipCode.length !== 6) {
      toast.error('Please enter a valid shipping pincode')
      return
    }

    if (!shippingAddress.city?.trim() || !shippingAddress.state?.trim()) {
      toast.error('Please provide shipping city and state (auto-filled or manual)')
      return
    }

    // Validate billing address if different
    if (!sameAsShipping) {
      if (!billingAddress.street?.trim()) {
        toast.error('Please enter billing street address')
        return
      }

      if (!billingAddress.zipCode || billingAddress.zipCode.length !== 6) {
        toast.error('Please enter a valid billing pincode')
        return
      }

      if (!billingAddress.city || !billingAddress.state) {
        toast.error('Please provide billing city and state (auto-filled or manual)')
        return
      }
    }

    const addressData = {
      shippingAddress: { ...shippingAddress, country: 'India' },
      billingAddress: sameAsShipping 
        ? { ...shippingAddress, country: 'India' } 
        : { ...billingAddress, country: 'India' }
    }

    onAddressSubmit(addressData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Shipping Address */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Truck className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>
        </div>

        <div className="space-y-4">
          {/* Street Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address *
            </label>
            <input
              type="text"
              required
              value={shippingAddress.street}
              onChange={(e) => handleShippingChange('street', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="House/Flat No., Building Name, Street, Area, Landmark"
            />
          </div>

          {/* Pincode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pincode *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                value={shippingAddress.zipCode}
                onChange={(e) => handleShippingChange('zipCode', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter 6-digit pincode (e.g., 110001, 400001, 560001)"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {getStatusIcon(shippingPincodeStatus)}
              </div>
            </div>
            {shippingMessage && (
              <div className={`mt-1 text-sm ${getStatusColor(shippingPincodeStatus)}`}>
                {shippingMessage}
              </div>
            )}
          </div>

          {/* City and State - Auto-fill when available; allow manual input when lookup fails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                  readOnly={shippingPincodeStatus !== 'error'}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg ${
                    shippingPincodeStatus === 'success'
                      ? 'bg-green-50 border-green-300 text-green-800 cursor-not-allowed'
                      : shippingPincodeStatus === 'error'
                        ? 'bg-white border-gray-300 text-gray-900'
                        : 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  placeholder={shippingPincodeStatus === 'error' ? 'Enter city manually' : 'Auto-filled from pincode'}
                />
                {shippingPincodeStatus === 'success' && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Lock className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                  readOnly={shippingPincodeStatus !== 'error'}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg ${
                    shippingPincodeStatus === 'success'
                      ? 'bg-green-50 border-green-300 text-green-800 cursor-not-allowed'
                      : shippingPincodeStatus === 'error'
                        ? 'bg-white border-gray-300 text-gray-900'
                        : 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  placeholder={shippingPincodeStatus === 'error' ? 'Enter state manually' : 'Auto-filled from pincode'}
                />
                {shippingPincodeStatus === 'success' && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Lock className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Address */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Billing Address</h3>
          </div>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={sameAsShipping}
              onChange={(e) => setSameAsShipping(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Same as shipping address</span>
          </label>
        </div>

        {!sameAsShipping && (
          <div className="space-y-4">
            {/* Street Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                required
                value={billingAddress.street}
                onChange={(e) => handleBillingChange('street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="House/Flat No., Building Name, Street, Area, Landmark"
              />
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pincode *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={billingAddress.zipCode}
                  onChange={(e) => handleBillingChange('zipCode', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter 6-digit pincode (e.g., 110001, 400001, 560001)"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {getStatusIcon(billingPincodeStatus)}
                </div>
              </div>
              {billingMessage && (
                <div className={`mt-1 text-sm ${getStatusColor(billingPincodeStatus)}`}>
                  {billingMessage}
                </div>
              )}
            </div>

            {/* City and State - Auto-fill when available; allow manual input when lookup fails */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={billingAddress.city}
                    onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                    readOnly={billingPincodeStatus !== 'error'}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg ${
                      billingPincodeStatus === 'success'
                        ? 'bg-green-50 border-green-300 text-green-800 cursor-not-allowed' 
                        : billingPincodeStatus === 'error'
                          ? 'bg-white border-gray-300 text-gray-900'
                          : 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    placeholder={billingPincodeStatus === 'error' ? 'Enter city manually' : 'Auto-filled from pincode'}
                  />
                  {billingPincodeStatus === 'success' && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Lock className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={billingAddress.state}
                    onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                    readOnly={billingPincodeStatus !== 'error'}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg ${
                      billingPincodeStatus === 'success'
                        ? 'bg-green-50 border-green-300 text-green-800 cursor-not-allowed' 
                        : billingPincodeStatus === 'error'
                          ? 'bg-white border-gray-300 text-gray-900'
                          : 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    placeholder={billingPincodeStatus === 'error' ? 'Enter state manually' : 'Auto-filled from pincode'}
                  />
                  {billingPincodeStatus === 'success' && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Lock className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="large"
          isLoading={isLoading}
          disabled={
            isLoading ||
            !shippingAddress.street?.trim() ||
            shippingAddress.zipCode?.length !== 6 ||
            !shippingAddress.city?.trim() ||
            !shippingAddress.state?.trim() ||
            (!sameAsShipping && (
              !billingAddress.street?.trim() ||
              billingAddress.zipCode?.length !== 6 ||
              !billingAddress.city?.trim() ||
              !billingAddress.state?.trim()
            ))
          }
        >
          Continue to Payment
        </Button>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Delivery within India only</p>
            <p>Enter your pincode to automatically fill city and state. This ensures accurate delivery across India.</p>
          </div>
        </div>
      </div>
    </form>
  )
}

export default CheckoutAddressForm
