const axios = require('axios')

const testProductsAPI = async () => {
  try {
    console.log('Testing Products API...')
    
    // Test the products endpoint
    const response = await axios.get('http://localhost:5000/api/products')
    
    console.log('✅ Products API Response:')
    console.log(`Status: ${response.status}`)
    console.log(`Total Products: ${response.data.products.length}`)
    console.log(`Pagination:`, response.data.pagination)
    
    if (response.data.products.length > 0) {
      console.log('\n📦 Sample Products:')
      response.data.products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ₹${product.price} (${product.status})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error testing products API:', error.message)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
  }
}

testProductsAPI()