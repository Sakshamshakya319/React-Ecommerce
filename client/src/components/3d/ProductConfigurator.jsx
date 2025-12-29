import React, { useState, useCallback } from 'react'
import { Palette, Layers, RotateCcw } from 'lucide-react'
import ProductViewer from './ProductViewer'
import Button from '../ui/Button'

const ProductConfigurator = ({ 
  product, 
  onConfigurationChange,
  className = '' 
}) => {
  const [selectedColor, setSelectedColor] = useState(product?.variants?.[0]?.color || '#ffffff')
  const [selectedMaterial, setSelectedMaterial] = useState(product?.variants?.[0]?.material || 'standard')
  const [selectedEnvironment, setSelectedEnvironment] = useState('city')

  // Available colors
  const colors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
  ]

  // Available materials
  const materials = [
    { name: 'Standard', value: 'standard' },
    { name: 'Metallic', value: 'metallic' },
    { name: 'Glass', value: 'glass' },
    { name: 'Matte', value: 'matte' },
  ]

  // Available environments
  const environments = [
    { name: 'City', value: 'city' },
    { name: 'Studio', value: 'studio' },
    { name: 'Sunset', value: 'sunset' },
    { name: 'Forest', value: 'forest' },
    { name: 'Apartment', value: 'apartment' },
  ]

  const handleColorChange = useCallback((color) => {
    setSelectedColor(color)
    onConfigurationChange?.({
      color,
      material: selectedMaterial,
      environment: selectedEnvironment
    })
  }, [selectedMaterial, selectedEnvironment, onConfigurationChange])

  const handleMaterialChange = useCallback((material) => {
    setSelectedMaterial(material)
    onConfigurationChange?.({
      color: selectedColor,
      material,
      environment: selectedEnvironment
    })
  }, [selectedColor, selectedEnvironment, onConfigurationChange])

  const handleEnvironmentChange = useCallback((environment) => {
    setSelectedEnvironment(environment)
    onConfigurationChange?.({
      color: selectedColor,
      material: selectedMaterial,
      environment
    })
  }, [selectedColor, selectedMaterial, onConfigurationChange])

  const resetConfiguration = () => {
    const defaultColor = product?.variants?.[0]?.color || '#ffffff'
    const defaultMaterial = product?.variants?.[0]?.material || 'standard'
    const defaultEnvironment = 'city'

    setSelectedColor(defaultColor)
    setSelectedMaterial(defaultMaterial)
    setSelectedEnvironment(defaultEnvironment)

    onConfigurationChange?.({
      color: defaultColor,
      material: defaultMaterial,
      environment: defaultEnvironment
    })
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* 3D Viewer */}
      <div className="lg:col-span-2">
        <ProductViewer
          modelUrl={product?.modelUrl}
          color={selectedColor}
          material={selectedMaterial}
          environment={selectedEnvironment}
          className="h-96 lg:h-[500px]"
        />
      </div>

      {/* Configuration Panel */}
      <div className="space-y-6">
        {/* Color Selection */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Palette className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Color</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorChange(color.value)}
                className={`
                  w-12 h-12 rounded-lg border-2 transition-all duration-200
                  ${selectedColor === color.value 
                    ? 'border-primary-500 ring-2 ring-primary-200' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {color.value === '#ffffff' && (
                  <div className="w-full h-full rounded-md border border-gray-200"></div>
                )}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Selected: {colors.find(c => c.value === selectedColor)?.name}
          </p>
        </div>

        {/* Material Selection */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Layers className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Material</h3>
          </div>
          <div className="space-y-2">
            {materials.map((material) => (
              <button
                key={material.value}
                onClick={() => handleMaterialChange(material.value)}
                className={`
                  w-full p-3 text-left rounded-lg border transition-all duration-200
                  ${selectedMaterial === material.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }
                `}
              >
                <div className="font-medium">{material.name}</div>
                <div className="text-sm text-gray-500">
                  {material.value === 'standard' && 'Default material finish'}
                  {material.value === 'metallic' && 'Shiny metallic surface'}
                  {material.value === 'glass' && 'Transparent glass effect'}
                  {material.value === 'matte' && 'Non-reflective surface'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Environment Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Environment</h3>
          <div className="space-y-2">
            {environments.map((env) => (
              <button
                key={env.value}
                onClick={() => handleEnvironmentChange(env.value)}
                className={`
                  w-full p-2 text-left rounded-lg border transition-all duration-200
                  ${selectedEnvironment === env.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }
                `}
              >
                {env.name}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={resetConfiguration}
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Configuration
        </Button>

        {/* Configuration Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Current Configuration</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Color: {colors.find(c => c.value === selectedColor)?.name}</div>
            <div>Material: {materials.find(m => m.value === selectedMaterial)?.name}</div>
            <div>Environment: {environments.find(e => e.value === selectedEnvironment)?.name}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductConfigurator