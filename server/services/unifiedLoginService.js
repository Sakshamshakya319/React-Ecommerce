const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const admin = require('firebase-admin')
const User = require('../models/User')
const Seller = require('../models/Seller')

class UnifiedLoginService {
  
  // Detect account type and authenticate
  async authenticateUser(email, password) {
    try {
      // First check if it's a seller
      const seller = await Seller.findOne({ email }).select('+password')
      if (seller) {
        return await this.authenticateSeller(seller, password)
      }

      // Then check if it's a user
      const user = await User.findOne({ email }).select('+password')
      if (user) {
        return await this.authenticateRegularUser(user, password)
      }

      // No account found
      return {
        success: false,
        message: 'No account found with this email address',
        accountType: 'unknown'
      }

    } catch (error) {
      console.error('Unified authentication error:', error)
      return {
        success: false,
        message: 'Authentication failed',
        error: error.message
      }
    }
  }

  // Authenticate seller
  async authenticateSeller(seller, password) {
    try {
      // Check if seller is approved
      if (seller.status !== 'approved') {
        return {
          success: false,
          message: `Your seller account is ${seller.status}. Please contact support.`,
          accountType: 'seller',
          status: seller.status
        }
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, seller.password)
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid credentials',
          accountType: 'seller'
        }
      }

      // Create JWT token for seller
      const token = jwt.sign(
        { 
          sellerId: seller._id,
          role: 'seller',
          businessName: seller.businessName,
          accountType: 'seller'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      )

      // Remove password from response
      seller.password = undefined

      return {
        success: true,
        message: 'Seller login successful',
        accountType: 'seller',
        token,
        user: seller,
        redirectTo: '/seller'
      }

    } catch (error) {
      console.error('Seller authentication error:', error)
      return {
        success: false,
        message: 'Seller authentication failed',
        accountType: 'seller',
        error: error.message
      }
    }
  }

  // Authenticate regular user
  async authenticateRegularUser(user, password) {
    try {
      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          message: 'Your account is inactive. Please contact support.',
          accountType: 'user',
          status: 'inactive'
        }
      }

      // Check if user has local password
      if (user.password) {
        // Use local password authentication
        const isPasswordValid = await user.comparePassword(password)
        if (!isPasswordValid) {
          return {
            success: false,
            message: 'Invalid credentials',
            accountType: 'user'
          }
        }
      } else {
        // User might be Firebase-only, suggest using Google login
        return {
          success: false,
          message: 'Please use Google Sign-In for this account',
          accountType: 'user',
          suggestGoogleLogin: true
        }
      }

      // Update last login
      await user.updateLastLogin()

      // Generate JWT tokens for user
      const accessToken = jwt.sign(
        { 
          userId: user._id,
          role: 'user',
          accountType: 'user'
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
      )
      
      const refreshToken = jwt.sign(
        { 
          userId: user._id,
          accountType: 'user'
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
      )

      // Save refresh token to user
      user.refreshToken = refreshToken
      await user.save()

      return {
        success: true,
        message: 'User login successful',
        accountType: 'user',
        token: accessToken,
        refreshToken,
        user: user.toSafeObject(),
        redirectTo: '/'
      }

    } catch (error) {
      console.error('User authentication error:', error)
      return {
        success: false,
        message: 'User authentication failed',
        accountType: 'user',
        error: error.message
      }
    }
  }

  // Firebase authentication for both users and sellers
  async authenticateWithFirebase(idToken, firebaseUser) {
    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken)
      const firebaseEmail = decodedToken.email

      // First check if it's a seller
      let seller = await Seller.findOne({
        $or: [
          { email: firebaseEmail },
          { firebaseUid: decodedToken.uid }
        ]
      })

      if (seller) {
        return await this.authenticateSellerWithFirebase(seller, decodedToken, firebaseUser)
      }

      // Then check if it's a user or create new user
      let user = await User.findOne({
        $or: [
          { firebaseUid: decodedToken.uid },
          { email: firebaseEmail }
        ]
      })

      if (!user) {
        // Create new user
        const customerId = User.generateCustomerId()
        
        user = new User({
          firebaseUid: decodedToken.uid,
          customerId,
          email: firebaseEmail,
          displayName: decodedToken.name || firebaseUser.displayName || 'User',
          phoneNumber: decodedToken.phone_number || firebaseUser.phoneNumber || '',
          photoURL: decodedToken.picture || firebaseUser.photoURL || '',
          isEmailVerified: decodedToken.email_verified || false,
          role: 'user',
          provider: 'google'
        })
        
        await user.save()
      } else {
        // Update existing user
        if (!user.firebaseUid) {
          user.firebaseUid = decodedToken.uid
        }
        user.photoURL = decodedToken.picture || firebaseUser.photoURL || user.photoURL
        user.isEmailVerified = decodedToken.email_verified || user.isEmailVerified
        await user.updateLastLogin()
      }

      // Generate JWT tokens for user
      const accessToken = jwt.sign(
        { 
          userId: user._id,
          role: 'user',
          accountType: 'user',
          firebaseUid: decodedToken.uid
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
      )
      
      const refreshToken = jwt.sign(
        { 
          userId: user._id,
          accountType: 'user'
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
      )

      // Save refresh token to user
      user.refreshToken = refreshToken
      await user.save()

      return {
        success: true,
        message: 'Firebase login successful',
        accountType: 'user',
        token: accessToken,
        refreshToken,
        user: user.toSafeObject(),
        redirectTo: '/'
      }

    } catch (error) {
      console.error('Firebase authentication error:', error)
      
      if (error.code && error.code.startsWith('auth/')) {
        return {
          success: false,
          message: 'Invalid Firebase token',
          accountType: 'unknown'
        }
      }

      return {
        success: false,
        message: 'Firebase authentication failed',
        accountType: 'unknown',
        error: error.message
      }
    }
  }

  // Authenticate seller with Firebase
  async authenticateSellerWithFirebase(seller, decodedToken, firebaseUser) {
    try {
      // Check if se