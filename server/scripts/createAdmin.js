const mongoose = require('mongoose')
const Admin = require('../models/Admin')
require('dotenv').config()

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'sakshamshakya94' })
    
    if (existingAdmin) {
      console.log('Admin already exists')
      process.exit(0)
    }
    
    // Create admin user
    const admin = new Admin({
      username: 'sakshamshakya94',
      email: 'sakshamshakya319@gmail.com',
      password: 'nrt*gam1apt0AZX-gdx',
      name: 'Saksham Shakya',
      role: 'super-admin',
      permissions: ['all'],
      isActive: true
    })
    
    await admin.save()
    console.log('Admin user created successfully')
    console.log('Username:', admin.username)
    console.log('Email:', admin.email)
    
    process.exit(0)
    
  } catch (error) {
    console.error('Error creating admin:', error)
    process.exit(1)
  }
}

createAdmin()