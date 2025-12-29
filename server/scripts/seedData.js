const mongoose = require('mongoose')
const Product = require('../models/Product')
require('dotenv').config()

const sampleProducts = [
  {
    name: "3D Printed Vase",
    slug: "3d-printed-vase",
    description: "Beautiful ceramic-style vase created with advanced 3D printing technology. Perfect for modern home decor with its sleek design and durable construction.",
    shortDescription: "Modern 3D printed vase for home decoration",
    category: "Home Decor",
    price: 29.99,
    originalPrice: 39.99,
    discount: 25,
    stock: 50,
    sku: "PRD001",
    modelUrl: "/models/default-product.glb",
    images: [
      {
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
        alt: "3D Printed Vase - Front View",
        isPrimary: true
      }
    ],
    status: "active",
    featured: true,
    specifications: {
      dimensions: {
        length: 15,
        width: 15,
        height: 25,
        unit: "cm"
      },
      weight: {
        value: 0.5,
        unit: "kg"
      },
      material: "PLA Plastic",
      features: [
        "Eco-friendly PLA material",
        "Waterproof coating",
        "Modern design",
        "Available in multiple colors"
      ]
    },
    variants: [
      {
        name: "White Matte",
        color: "#ffffff",
        material: "matte",
        price: 29.99,
        stock: 20,
        sku: "PRD001-WHT-MAT",
        isActive: true
      },
      {
        name: "Black Glossy",
        color: "#000000",
        material: "standard",
        price: 32.99,
        stock: 15,
        sku: "PRD001-BLK-STD",
        isActive: true
      }
    ],
    tags: ["3d-printed", "vase", "home-decor", "modern"],
    rating: {
      average: 4.5,
      count: 12
    }
  },
  {
    name: "Designer Lamp Shade",
    slug: "designer-lamp-shade",
    description: "Unique geometric lamp shade designed for modern interiors. 3D printed with precision for perfect light diffusion and contemporary aesthetics.",
    shortDescription: "Geometric 3D printed lamp shade",
    category: "Lighting",
    price: 45.99,
    stock: 30,
    sku: "PRD002",
    modelUrl: "/models/default-product.glb",
    images: [
      {
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        alt: "Designer Lamp Shade",
        isPrimary: true
      }
    ],
    status: "active",
    featured: true,
    specifications: {
      dimensions: {
        length: 20,
        width: 20,
        height: 30,
        unit: "cm"
      },
      weight: {
        value: 0.3,
        unit: "kg"
      },
      material: "PETG Plastic",
      features: [
        "Perfect light diffusion",
        "Easy installation",
        "Geometric design",
        "Durable PETG material"
      ]
    },
    variants: [
      {
        name: "Natural White",
        color: "#f8f8f8",
        material: "standard",
        price: 45.99,
        stock: 15,
        sku: "PRD002-WHT-STD",
        isActive: true
      },
      {
        name: "Warm Amber",
        color: "#ffb366",
        material: "standard",
        price: 48.99,
        stock: 10,
        sku: "PRD002-AMB-STD",
        isActive: true
      }
    ],
    tags: ["lamp", "lighting", "geometric", "modern"],
    rating: {
      average: 4.8,
      count: 8
    }
  },
  {
    name: "Minimalist Phone Stand",
    slug: "minimalist-phone-stand",
    description: "Clean and functional phone stand designed for any desk setup. Adjustable angle and universal compatibility with all smartphone sizes.",
    shortDescription: "Adjustable 3D printed phone stand",
    category: "Accessories",
    price: 15.99,
    stock: 100,
    sku: "PRD003",
    modelUrl: "/models/default-product.glb",
    images: [
      {
        url: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400",
        alt: "Minimalist Phone Stand",
        isPrimary: true
      }
    ],
    status: "active",
    featured: false,
    specifications: {
      dimensions: {
        length: 8,
        width: 10,
        height: 12,
        unit: "cm"
      },
      weight: {
        value: 0.1,
        unit: "kg"
      },
      material: "PLA Plastic",
      features: [
        "Universal compatibility",
        "Adjustable viewing angle",
        "Non-slip base",
        "Compact design"
      ]
    },
    variants: [
      {
        name: "Classic Black",
        color: "#000000",
        material: "matte",
        price: 15.99,
        stock: 50,
        sku: "PRD003-BLK-MAT",
        isActive: true
      },
      {
        name: "Pure White",
        color: "#ffffff",
        material: "matte",
        price: 15.99,
        stock: 50,
        sku: "PRD003-WHT-MAT",
        isActive: true
      }
    ],
    tags: ["phone-stand", "desk-accessory", "minimalist"],
    rating: {
      average: 4.3,
      count: 25
    }
  }
]

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear existing products
    await Product.deleteMany({})
    console.log('Cleared existing products')

    // Insert sample products
    const products = await Product.insertMany(sampleProducts)
    console.log(`Inserted ${products.length} sample products`)

    console.log('Sample products:')
    products.forEach(product => {
      console.log(`- ${product.name} (${product.sku})`)
    })

    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()