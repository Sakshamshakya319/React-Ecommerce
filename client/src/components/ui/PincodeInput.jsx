import React, { useState, useEffect } from 'react'
import { MapPin, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { apiClient } from '../../api/client'

const PincodeInput = ({ 
  value = '', 
  onChange, 
  onLocationFound, 
  className = '',
  placeholder = 'Enter 6-digit pincode',
  disabled = false 
}) => {
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')

  // Debounce pincode lookup
  useEffect(() => {
    if (value && value.length === 6 && /^\d{6}$/.test(value)) {
      const timeoutId = setTimeout(() => {
        fetchPincodeData(value)
      }, 500)

      return () => clearTimeout(timeoutId)
    } else if (value && value.length > 0) {
      setStatus('idle')
      setMessage('')
    }
  }, [value])

  const fetchPincodeData = async (pincode) => {
    setStatus('loading')
    setMessage('Looking up pincode...')
    
    try {
      const response = await apiClient.get(`/pincode/${pincode}`)
      
      if (response.data.success) {
        const locationData = response.data.data
        
        setStatus('success')
        setMessage(`${locationData.city}, ${locationData.state}`)
        
        // Notify parent component
        if (onLocationFound) {
          onLocationFound(locationData)
        }
      }
    } catch (error) {
      setStatus('error')
      
      if (error.response?.status === 404) {
        setMessage('Pincode not found')
      } else if (error.response?.status === 400) {
        setMessage('Invalid pincode format')
      } else {
        setMessage('Unable to fetch location')
      }
      
      // Notify parent component of error
      if (onLocationFound) {
        onLocationFound(null)
      }
    }
  }

  const getStatusIcon = () => {
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

  const getStatusColor = () => {
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

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const newValue = e.target.value.replace(/\D/g, '').slice(0, 6) // Only digits, max 6
            onChange(newValue)
          }}
          className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${className}`}
          placeholder={placeholder}
          maxLength={6}
          disabled={disabled}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {getStatusIcon()}
        </div>
      </div>
      
      {message && (
        <div className={`text-sm ${getStatusColor()}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default PincodeInput