import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Store, Upload, FileText, Phone, Mail, MapPin, CreditCard, Lock } from 'lucide-react'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { apiClient } from '../../api/client'
import toast from 'react-hot-toast'

const SellerRegister = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isPincodeLoading, setIsPincodeLoading] = useState(false)
  const [pincodeStatus, setPincodeStatus] = useState('idle') // idle, loading, success, error
  const [pincodeMessage, setPincodeMessage] = useState('')
  const [formData, setFormData] = useState({
    // Business Information
    businessName: '',
    businessType: 'individual', // individual, partnership, company, llp
    gstNumber: '',
    panNumber: '',
    
    // Contact Information
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    alternatePhone: '',
    
    // Address Information
    businessAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    
    // Bank Details
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branch: ''
    },
    
    // Business Details
    businessDescription: '',
    website: '',
    categories: [],
    expectedMonthlyVolume: '',
    
    // Documents
    documents: {
      gstCertificate: null,
      panCard: null,
      bankStatement: null,
      businessProof: null
    }
  })

  const businessTypes = [
    { value: 'individual', label: 'Individual/Proprietorship' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'company', label: 'Private/Public Company' },
    { value: 'llp', label: 'Limited Liability Partnership' }
  ]

  const availableCategories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 
    'Toys', 'Beauty', 'Automotive', 'Health', 'Jewelry'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handlePincodeChange = async (e) => {
    const pincode = e.target.value
    
    // Update pincode in form data
    setFormData(prev => ({
      ...prev,
      businessAddress: {
        ...prev.businessAddress,
        pincode: pincode
      }
    }))

    // Auto-fill city and state if pincode is 6 digits
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      setIsPincodeLoading(true)
      setPincodeStatus('loading')
      setPincodeMessage('Looking up pincode...')
      try {
        const response = await apiClient.get(`/pincode/${pincode}`)
        
        if (response.data.success && response.data.data) {
          const { city, state } = response.data.data
          
          setFormData(prev => ({
            ...prev,
            businessAddress: {
              ...prev.businessAddress,
              city: city || '',
              state: state || ''
            }
          }))
          
          setPincodeStatus('success')
          setPincodeMessage(`${city}, ${state}`)
          toast.success(`Auto-filled: ${city}, ${state}`)
        }
      } catch (error) {
        console.error('Pincode lookup error:', error)
        setPincodeStatus('error')
        setPincodeMessage('Unable to fetch location data. Please enter city/state manually.')
        // Don't show error toast for pincode lookup failures
        // as it's just a convenience feature
      } finally {
        setIsPincodeLoading(false)
      }
    }
  }

  const handleFileChange = (e, documentType) => {
    const file = e.target.files[0]
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: file
      }
    }))
  }

  const validateForm = () => {
    const required = [
      'businessName', 'ownerName', 'email', 'password', 'phone', 'businessDescription'
    ]
    
    for (let field of required) {
      if (!formData[field]) {
        toast.error(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`)
        return false
      }
    }

    // Address validation
    if (!formData.businessAddress.pincode) {
      toast.error('Pincode is required')
      return false
    }

    if (!formData.businessAddress.city) {
      toast.error('City is required')
      return false
    }

    if (!formData.businessAddress.state) {
      toast.error('State is required')
      return false
    }

    // Password validation
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return false
    }

    if (formData.categories.length === 0) {
      toast.error('Please select at least one category')
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return false
    }

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number starting with 6-9')
      return false
    }

    // Pincode validation
    const pincodeRegex = /^\d{6}$/
    if (!pincodeRegex.test(formData.businessAddress.pincode)) {
      toast.error('Please enter a valid 6-digit pincode')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      // Create FormData for file uploads
      const submitData = new FormData()
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        if (key === 'documents') {
          Object.keys(formData.documents).forEach(docKey => {
            if (formData.documents[docKey]) {
              submitData.append(docKey, formData.documents[docKey])
            }
          })
        } else if (typeof formData[key] === 'object') {
          submitData.append(key, JSON.stringify(formData[key]))
        } else {
          submitData.append(key, formData[key])
        }
      })

      const response = await apiClient.post('/seller/register', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      toast.success('Seller registration submitted successfully! We will review your application and get back to you within 2-3 business days.')
      navigate('/')
    } catch (error) {
      console.error('Registration error:', error)
      const serverMessage = error.response?.data?.message
      const serverErrors = error.response?.data?.errors
      
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        serverErrors.slice(0, 4).forEach(err => {
          toast.error(`${err.field}: ${err.message}`)
        })
      } else {
        toast.error(serverMessage || 'Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center">
                <Store className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Become a Seller
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join our marketplace and start selling your products to millions of customers
            </p>
          </div>

          {/* Registration Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Store className="h-5 w-5 mr-2" />
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Type *
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    >
                      {businessTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      GST Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                      placeholder="22AAAAA0000A1Z5"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      PAN Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleInputChange}
                      placeholder="ABCDE1234F"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Owner/Contact Person Name *
                    </label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Re-enter password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Alternate Phone
                    </label>
                    <input
                      type="tel"
                      name="alternatePhone"
                      value={formData.alternatePhone}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Business Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Business Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="businessAddress.street"
                      value={formData.businessAddress.street}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter your business street address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pincode *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="businessAddress.pincode"
                        value={formData.businessAddress.pincode}
                        onChange={handlePincodeChange}
                        className="input-field pr-10"
                        placeholder="Enter 6-digit pincode"
                        maxLength="6"
                        required
                      />
                      {isPincodeLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <LoadingSpinner size="sm" />
                        </div>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${
                      pincodeStatus === 'success' ? 'text-green-600' :
                      pincodeStatus === 'error' ? 'text-red-600' :
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {pincodeStatus === 'success'
                        ? 'City and state auto-filled'
                        : pincodeStatus === 'error'
                          ? 'API failed. Enter city and state manually.'
                          : 'City and state will be auto-filled'}
                    </p>
                  </div>
                  <div></div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="businessAddress.city"
                      value={formData.businessAddress.city}
                      className={`input-field ${
                        pincodeStatus === 'success'
                          ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                          : pincodeStatus === 'error'
                            ? ''
                            : 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                      }`}
                      placeholder={pincodeStatus === 'error' ? 'Enter city manually' : 'Auto-filled from pincode'}
                      readOnly={pincodeStatus !== 'error'}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="businessAddress.state"
                      value={formData.businessAddress.state}
                      className={`input-field ${
                        pincodeStatus === 'success'
                          ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                          : pincodeStatus === 'error'
                            ? ''
                            : 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                      }`}
                      placeholder={pincodeStatus === 'error' ? 'Enter state manually' : 'Auto-filled from pincode'}
                      readOnly={pincodeStatus !== 'error'}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Product Categories *
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {availableCategories.map(category => (
                    <label key={category} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                        className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Business Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Description *
                </label>
                <textarea
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-field"
                  placeholder="Describe your business, products, and what makes you unique..."
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  isLoading={isLoading}
                  className="px-12"
                >
                  {isLoading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-600 dark:text-gray-400">
              Already have a seller account?{' '}
              <Link to="/seller/login" className="text-primary-600 dark:text-primary-400 hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SellerRegister
