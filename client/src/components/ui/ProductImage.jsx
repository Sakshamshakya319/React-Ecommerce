import React from 'react'
import { Package } from 'lucide-react'
import { getImageUrl, createImageErrorHandler } from '../../utils/imageUtils'

const ProductImage = ({ 
  product, 
  className = "w-full h-full object-cover",
  containerClassName = "w-full h-full bg-gray-100 rounded-lg overflow-hidden",
  showPlaceholder = true,
  alt = null
}) => {
  const imageUrl = product?.images?.[0]?.url
  const productName = product?.name || 'Product'
  const altText = alt || productName

  return (
    <div className={containerClassName}>
      {imageUrl ? (
        <img
          src={getImageUrl(imageUrl)}
          alt={altText}
          className={className}
          onError={createImageErrorHandler(productName, 400, 400)}
        />
      ) : showPlaceholder ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
      ) : null}
    </div>
  )
}

export default ProductImage