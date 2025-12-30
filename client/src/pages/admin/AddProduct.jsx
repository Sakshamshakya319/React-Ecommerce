import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, Upload, X, Plus, Minus } from 'lucide-react'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { apiClient } from '../../api/client'
import toast from 'react-hot-toast'

const AddProduct = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    sku: '',
    stock: '',
    brand: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    features: [''],
    specifications: [{ key: '', value: '' }],
    tags: '',
    status: 'active',
    isFeatured: false,
    modelUrl: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: ''
  })

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports & Fitness',
    'Books & Media',
    'Toys & Games',
    'Beauty & Personal Care',
    'Automotive',
    'Health & Wellness',
    'Jewelry & Accessories'
  ]

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
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
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    
    if (files.length + imageFiles.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result])
      }
      reader.readAsDataURL(file)
    })

    setImageFiles(prev => [...prev, ...files])
  }

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }))
  }

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const updateFeature = (index, value) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }))
  }

  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }))
  }

  const removeSpecification = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }))
  }

  const updateSpecification = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) => 
        i === index ? { ...spec, [field]: value } : spec
      )
    }))
  }

  const validateForm = () => {
    const required = ['name', 'description', 'price', 'category']
    
    for (let field of required) {
      if (!formData[field]) {
        toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`)
        return false
      }
    }

    if (parseFloat(formData.price) <= 0) {
      toast.error('Price must be greater than 0')
      return false
    }

    if (parseInt(formData.stock) < 0) {
      toast.error('Stock cannot be negative')
      return false
    }

    // Images are now optional
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      let uploadedImages = []

      // Upload images first if any
      if (imageFiles.length > 0) {
        const imageFormData = new FormData()
        imageFiles.forEach(file => {
          imageFormData.append('images', file)
        })

        const uploadResponse = await apiClient.post('/upload/product-images', imageFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        uploadedImages = uploadResponse.data.images.map((img, index) => {
          // Construct full URL
          const baseUrl = import.meta.env.VITE_API_URL 
            ? import.meta.env.VITE_API_URL.replace('/api', '') 
            : 'http://localhost:5000';
          
          return {
            url: `${baseUrl}${img.url}`,
            alt: formData.name,
            isPrimary: index === 0
          }
        })
      }

      // Prepare product data
      const submitData = {
        ...formData,
        images: uploadedImages,
        features: formData.features.filter(f => f.trim()),
        specifications: formData.specifications.filter(s => s.key && s.value),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0
      }

      console.log('Submitting product data:', submitData)

      const response = await apiClient.post('/admin/products', submitData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      toast.success('Product added successfully!')
      navigate('/admin/products')
    } catch (error) {
      console.error('Add product error:', error)
      toast.error(error.response?.data?.message || 'Failed to add product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 lg:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/shoporia.png" 
                alt="Shoporia Logo" 
                className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
              />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Add New Product</h1>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Create a new product listing for your store</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <form onSubmit={handleSubmit} className="p-4 lg:p-8 space-y-6 lg:space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter brand name"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-field"
                  placeholder="Describe your product in detail..."
                  required
                />
              </div>

              {/* Pricing & Inventory */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing & Inventory</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="0.0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dimensions (cm)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Length
                    </label>
                    <input
                      type="number"
                      name="dimensions.length"
                      value={formData.dimensions.length}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Width
                    </label>
                    <input
                      type="number"
                      name="dimensions.width"
                      value={formData.dimensions.width}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Height
                    </label>
                    <input
                      type="number"
                      name="dimensions.height"
                      value={formData.dimensions.height}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Product Images */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Images (Optional)</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or JPEG (MAX. 5MB each, 5 images max)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                  
                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3D Model */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">3D Model (Optional)</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    3D Model URL
                  </label>
                  <input
                    type="url"
                    name="modelUrl"
                    value={formData.modelUrl}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="https://example.com/model.glb (optional)"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Provide a URL to a .glb or .gltf 3D model file (optional - a default model will be used if not provided)
                  </p>
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Features</h3>
                <div className="space-y-3">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 input-field"
                        placeholder="Enter product feature"
                      />
                      {formData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Feature</span>
                  </button>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Specifications</h3>
                <div className="space-y-3">
                  {formData.specifications.map((spec, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                        className="flex-1 input-field"
                        placeholder="Specification name"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                        className="flex-1 input-field"
                        placeholder="Specification value"
                      />
                      {formData.specifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSpecification(index)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSpecification}
                    className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Specification</span>
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter tags separated by commas (e.g., electronics, smartphone, android)"
                />
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Featured Product
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/products')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="px-8"
                >
                  {isLoading ? 'Adding Product...' : 'Add Product'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AddProduct