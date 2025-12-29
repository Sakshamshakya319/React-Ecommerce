const mongoose = require('mongoose')
const Product = require('../models/Product')
require('dotenv').config()

const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    slug: 'wireless-bluetooth-headphones',
    description: 'High-quality wireless Bluetooth headphones with noise cancellation and long battery life. Perfect for music lovers and professionals.',
    shortDescription: 'Premium wireless headphones with noise cancellation',
    category: 'Electronics',
    subcategory: 'Audio',
    brand: 'TechSound',
    price: 2999,
    originalPrice: 3999,
    discount: 25,
    stock: 50,
    sku: 'WBH001',
    images: [
      {
        url: 'https://via.placeholder.com/400x400/1f2937/ffffff?text=Headphones',
        alt: 'Wireless Bluetooth Headphones',
        isPrimary: true
      }
    ],
    specifications: {
      features: ['Noise Cancellation', 'Wireless Connectivity', '30-hour Battery', 'Quick Charge'],
      dimensions: { length: 20, width: 18, height: 8, unit: 'cm' },
      weight: { value: 0.3, unit: 'kg' }
    },
    tags: ['wireless', 'bluetooth', 'headphones', 'audio', 'music'],
    status: 'active',
    featured: true
  },
  {
    name: 'Smart Fitness Watch',
    slug: 'smart-fitness-watch',
    description: 'Advanced fitness tracking watch with heart rate monitoring, GPS, and smartphone connectivity. Track your health and fitness goals.',
    shortDescription: 'Smart watch with fitness tracking and GPS',
    category: 'Electronics',
    subcategory: 'Wearables',
    brand: 'FitTech',
    price: 4999,
    originalPrice: 6999,
    discount: 28,
    stock: 30,
    sku: 'SFW002',
    images: [
      {
        url: 'https://via.placeholder.com/400x400/059669/ffffff?text=Smart+Watch',
        alt: 'Smart Fitness Watch',
        isPrimary: true
      }
    ],
    specifications: {
      features: ['Heart Rate Monitor', 'GPS Tracking', 'Water Resistant', 'Sleep Tracking'],
      dimensions: { length: 4.5, width: 4.5, height: 1.2, unit: 'cm' },
      weight: { value: 0.05, unit: 'kg' }
    },
    tags: ['smartwatch', 'fitness', 'health', 'gps', 'wearable'],
    status: 'active',
    featured: true
  },
  {
    name: 'Organic Cotton T-Shirt',
    slug: 'organic-cotton-t-shirt',
    description: 'Comfortable and sustainable organic cotton t-shirt. Available in multiple colors and sizes. Perfect for casual wear.',
    shortDescription: 'Sustainable organic cotton t-shirt',
    category: 'Fashion',
    subcategory: 'Clothing',
    brand: 'EcoWear',
    price: 899,
    originalPrice: 1299,
    discount: 30,
    stock: 100,
    sku: 'OCT003',
    images: [
      {
        url: 'https://via.placeholder.com/400x400/dc2626/ffffff?text=T-Shirt',
        alt: 'Organic Cotton T-Shirt',
        isPrimary: true
      }
    ],
    specifications: {
      features: ['100% Organic Cotton', 'Machine Washable', 'Breathable Fabric', 'Multiple Colors'],
      weight: { value: 0.2, unit: 'kg' }
    },
    tags: ['t-shirt', 'organic', 'cotton', 'sustainable', 'fashion'],
    status: 'active',
    featured: false
  },
  {
    name: 'Portable Power Bank 20000mAh',
    slug: 'portable-power-bank-20000mah',
    description: 'High-capacity portable power bank with fast charging technology. Keep your devices powered on the go.',
    shortDescription: 'High-capacity portable power bank',
    category: 'Electronics',
    subcategory: 'Accessories',
    brand: 'PowerMax',
    price: 1899,
    originalPrice: 2499,
    discount: 24,
    stock: 75,
    sku: 'PPB004',
    images: [
      {
        url: 'https://via.placeholder.com/400x400/7c3aed/ffffff?text=Power+Bank',
        alt: 'Portable Power Bank',
        isPrimary: true
      }
    ],
    specifications: {
      features: ['20000mAh Capacity', 'Fast Charging', 'Multiple Ports', 'LED Indicator'],
      dimensions: { length: 15, width: 7, height: 2.5, unit: 'cm' },
      weight: { value: 0.4, unit: 'kg' }
    },
    tags: ['powerbank', 'portable', 'charging', 'battery', 'mobile'],
    status: 'active',
    featured: false
  },
  {
    name: 'Yoga Mat Premium',
    slug: 'yoga-mat-premium',
    description: 'Premium non-slip yoga mat made from eco-friendly materials. Perfect for yoga, pilates, and fitness exercises.',
    shortDescription: 'Premium eco-friendly yoga mat',
    category: 'Sports & Fitness',
    subcategory: 'Exercise Equipment',
    brand: 'ZenFit',
    price: 1499,
    originalPrice: 1999,
    discount: 25,
    stock: 40,
    sku: 'YMP005',
    images: [
      {
        url: 'https://via.placeholder.com/400x400/10b981/ffffff?text=Yoga+Mat',
        alt: 'Premium Yoga Mat',
        isPrimary: true
      }
    ],
    specifications: {
      features: ['Non-Slip Surface', 'Eco-Friendly Material', '6mm Thickness', 'Carrying Strap'],
      dimensions: { length: 183, width: 61, height: 0.6, unit: 'cm' },
      weight: { value: 1.2, unit: 'kg' }
    },
    tags: ['yoga', 'mat', 'fitness', 'exercise', 'eco-friendly'],
    status: 'active',
    featured: false
  }
]

const seedProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    
    console.log('Connected to MongoDB')
    
    // Clear existing products
    await Product.deleteMany({})
    console.log('Cleared existing products')
    
    // Insert sample products
    const products = await Product.insertMany(sampleProducts)
    console.log(`✅ Successfully seeded ${products.length} products`)
    
    // Display created products
    products.forEach(product => {
      console.log(`- ${product.name} (${product.sku}) - ₹${product.price}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding products:', error)
    process.exit(1)
  }
}

// Run the seeding function
seedProducts()