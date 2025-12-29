import React, { useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import AddressForm from '../forms/AddressForm'
import PincodeInput from '../ui/PincodeInput'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

const PincodeDemo = () => {
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [pincode, setPincode] = useState('')
  const [locationData, setLocationData] = useState(null)

  const handleAddressSubmit = (addressData) => {
    console.log('Address submitted:', addressData)
    toast.success('Address saved successfully!')
    setShowAddressForm(false)
  }

  const handleLocationFound = (data) => {
    setLocationData(data)
    if (data) {
      toast.success(`Found: ${data.city}, ${data.state}`)
    }
  }

  const testPincodes = [
    { code: '110001', name: 'New Delhi' },
    { code: '400001', name: 'Mumbai' },
    { code: '560001', name: 'Bangalore' },
    { code: '600001', name: 'Chennai' },
    { code: '700001', name: 'Kolkata' },
    { code: '500001', name: 'Hyderabad' }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Indian Pincode Lookup Demo
        </h1>
        <p className="text-gray-600">
          Automatic city and state detection using Indian postal pincodes
        </p>
      </div>

      {/* Quick Pincode Test */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Quick Pincode Lookup</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Pincode
            </label>
            <PincodeInput
              value={pincode}
              onChange={setPincode}
              onLocationFound={handleLocationFound}
              placeholder="Try: 110001, 400001, 560001..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Information
            </label>
            {locationData ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm">
                  <p><strong>City:</strong> {locationData.city}</p>
                  <p><strong>State:</strong> {locationData.state}</p>
                  <p><strong>District:</strong> {locationData.district}</p>
                  <p><strong>Region:</strong> {locationData.region}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                Enter a valid 6-digit pincode to see location information
              </div>
            )}
          </div>
        </div>

        {/* Test Pincodes */}
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Try these sample pincodes:</p>
          <div className="flex flex-wrap gap-2">
            {testPincodes.map((test) => (
              <button
                key={test.code}
                onClick={() => setPincode(test.code)}
                className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-colors"
              >
                {test.code} ({test.name})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Address Form Demo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Complete Address Form</h2>
          </div>
          <Button
            onClick={() => setShowAddressForm(!showAddressForm)}
            variant={showAddressForm ? "outline" : "primary"}
          >
            {showAddressForm ? 'Hide Form' : 'Show Address Form'}
          </Button>
        </div>

        {showAddressForm && (
          <AddressForm
            title="Delivery Address"
            onSubmit={handleAddressSubmit}
            onCancel={() => setShowAddressForm(false)}
          />
        )}
      </div>

      {/* API Information */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• Uses the Indian Postal Service API: <code>https://api.postalpincode.in/pincode/{'{PINCODE}'}</code></p>
          <p>• Automatically detects city, state, district, and region from pincode</p>
          <p>• Provides real-time validation and error handling</p>
          <p>• Works with all valid Indian pincodes (6-digit format)</p>
          <p>• Includes debouncing to avoid excessive API calls</p>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Auto-Fill</h3>
          <p className="text-sm text-gray-600">
            Automatically fills city and state when you enter a valid pincode
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Real-time Lookup</h3>
          <p className="text-sm text-gray-600">
            Instant validation and location detection as you type
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Accurate Data</h3>
          <p className="text-sm text-gray-600">
            Uses official Indian Postal Service data for accuracy
          </p>
        </div>
      </div>
    </div>
  )
}

export default PincodeDemo