import React, { useState } from 'react'
import { MapPin, Truck, CheckCircle } from 'lucide-react'
import IndianShippingForm from '../forms/IndianShippingForm'
import CheckoutAddressForm from '../checkout/CheckoutAddressForm'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

const IndianShippingDemo = () => {
  const [showShippingForm, setShowShippingForm] = useState(false)
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [savedAddress, setSavedAddress] = useState(null)

  const handleShippingSubmit = (addressData) => {
    console.log('Shipping address submitted:', addressData)
    setSavedAddress(addressData)
    toast.success('Shipping address saved successfully!')
    setShowShippingForm(false)
  }

  const handleCheckoutSubmit = (addressData) => {
    console.log('Checkout addresses submitted:', addressData)
    toast.success('Addresses saved! Proceeding to payment...')
    setShowCheckoutForm(false)
  }

  const testPincodes = [
    { code: '110001', name: 'New Delhi, Delhi' },
    { code: '400001', name: 'Mumbai, Maharashtra' },
    { code: '560001', name: 'Bangalore, Karnataka' },
    { code: '600001', name: 'Chennai, Tamil Nadu' },
    { code: '700001', name: 'Kolkata, West Bengal' },
    { code: '500001', name: 'Hyderabad, Telangana' },
    { code: '302001', name: 'Jaipur, Rajasthan' },
    { code: '380001', name: 'Ahmedabad, Gujarat' }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Indian Shipping Address Forms
        </h1>
        <p className="text-gray-600">
          Optimized for Indian addresses with auto-fill and locked city/state fields
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Auto-Fill & Lock</h3>
          <p className="text-sm text-gray-600">
            City and state auto-filled from pincode and locked to prevent errors
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">India-Focused</h3>
          <p className="text-sm text-gray-600">
            Indian city/state placeholders, no country field, optimized for Indian addresses
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Accurate Delivery</h3>
          <p className="text-sm text-gray-600">
            Ensures accurate addresses using official Indian postal data
          </p>
        </div>
      </div>

      {/* Test Pincodes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test with Sample Pincodes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {testPincodes.map((test) => (
            <div key={test.code} className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="font-mono text-lg font-semibold text-primary-600">{test.code}</div>
              <div className="text-xs text-gray-600">{test.name}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4">
          Copy any pincode above and paste it in the forms below to see auto-fill in action.
        </p>
      </div>

      {/* Simple Shipping Form Demo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Simple Shipping Form</h2>
          </div>
          <Button
            onClick={() => setShowShippingForm(!showShippingForm)}
            variant={showShippingForm ? "outline" : "primary"}
          >
            {showShippingForm ? 'Hide Form' : 'Show Shipping Form'}
          </Button>
        </div>

        {showShippingForm && (
          <IndianShippingForm
            title="Delivery Address"
            onSubmit={handleShippingSubmit}
            onCancel={() => setShowShippingForm(false)}
          />
        )}

        {savedAddress && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Saved Address:</h4>
            <div className="text-sm text-green-700">
              <p>{savedAddress.street}</p>
              <p>{savedAddress.city}, {savedAddress.state} - {savedAddress.zipCode}</p>
              <p>{savedAddress.country}</p>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Form Demo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Checkout Address Form</h2>
          </div>
          <Button
            onClick={() => setShowCheckoutForm(!showCheckoutForm)}
            variant={showCheckoutForm ? "outline" : "primary"}
          >
            {showCheckoutForm ? 'Hide Checkout' : 'Show Checkout Form'}
          </Button>
        </div>

        {showCheckoutForm && (
          <CheckoutAddressForm onAddressSubmit={handleCheckoutSubmit} />
        )}
      </div>

      {/* Key Improvements */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Key Improvements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">✅ What's New:</h4>
            <ul className="space-y-1">
              <li>• Indian city/state placeholders (Mumbai, Maharashtra)</li>
              <li>• Auto-filled fields are locked and cannot be edited</li>
              <li>• No country field (automatically set to India)</li>
              <li>• Better street address placeholder</li>
              <li>• Submit button disabled until pincode is valid</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">🎯 Benefits:</h4>
            <ul className="space-y-1">
              <li>• Prevents address entry errors</li>
              <li>• Faster checkout process</li>
              <li>• Accurate delivery addresses</li>
              <li>• Better user experience for Indian customers</li>
              <li>• Consistent address format</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use in Your App</h3>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-900">For Simple Shipping:</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded mt-2 overflow-x-auto">
{`import IndianShippingForm from './components/forms/IndianShippingForm'

<IndianShippingForm
  title="Delivery Address"
  onSubmit={handleAddressSubmit}
/>`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900">For Checkout Process:</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded mt-2 overflow-x-auto">
{`import CheckoutAddressForm from './components/checkout/CheckoutAddressForm'

<CheckoutAddressForm 
  onAddressSubmit={handleCheckoutSubmit}
  isLoading={isProcessing}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndianShippingDemo