# 🛒 Modern E-commerce Platform

A full-stack e-commerce solution built with React, Node.js, and MongoDB, featuring advanced seller management, real-time pincode validation using India Post Office API, and comprehensive admin controls.

![E-commerce Platform](https://img.shields.io/badge/Platform-E--commerce-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248)
![Firebase](https://img.shields.io/badge/Auth-Firebase-orange)

## 🌟 Key Features

### 🏪 **Multi-Vendor Marketplace**
- **Seller Registration** with government document verification
- **Real-time Pincode Validation** using India Post Office API
- **Automated Address Detection** from pincode
- **Seller Dashboard** with analytics and order management
- **Admin Approval System** for seller onboarding

### 🛍️ **Customer Experience**
- **Modern UI/UX** with responsive design
- **Product Catalog** with advanced filtering
- **Shopping Cart** with real-time updates
- **Secure Checkout** with multiple payment options
- **Order Tracking** and history

### 🔐 **Authentication & Security**
- **Multi-role Authentication** (Customer, Seller, Admin)
- **Firebase Integration** for social login
- **JWT-based Security** with refresh tokens
- **Password Encryption** using bcrypt
- **Rate Limiting** and security headers

### 📍 **Government API Integration**
- **India Post Office API** for pincode validation
- **Automatic City/State Detection** from pincode
- **Address Standardization** for accurate delivery
- **Real-time Location Services** for better UX

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   - Vite        │    │   - Express     │    │   - Atlas       │
│   - Tailwind    │    │   - JWT Auth    │    │   - Mongoose    │
│   - Zustand     │    │   - Multer      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │  External APIs  │              │
         └──────────────►│  - India Post   │◄─────────────┘
                        │  - Firebase     │
                        │  - Email SMTP   │
                        └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB Atlas account
- Firebase project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ecommerce-platform.git
   cd ecommerce-platform
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

## 📋 Environment Configuration

### Backend (.env)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_32_chars_minimum
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_32_chars_minimum

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# CORS & Email
CLIENT_URL=http://localhost:3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### Frontend (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Firebase Web Config
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
```

## 🌐 API Documentation

### Core Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

#### Seller Management
- `POST /api/seller/register` - Seller registration with documents
- `POST /api/seller/login` - Seller authentication
- `GET /api/seller/profile` - Get seller profile
- `PUT /api/seller/profile` - Update seller profile

#### Pincode Services
- `GET /api/pincode/:pincode` - Get location data from pincode
- `GET /api/pincode/search/:query` - Search pincodes by location

#### Products & Orders
- `GET /api/products` - List products with filters
- `POST /api/products` - Create product (seller)
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order

### Government API Integration

#### India Post Office API
```javascript
// Pincode to Location
GET https://api.postalpincode.in/pincode/110001

// Response
{
  "Status": "Success",
  "PostOffice": [{
    "Name": "Connaught Place",
    "District": "Central Delhi",
    "State": "Delhi",
    "Country": "India"
  }]
}
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **React Hook Form** - Form handling

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email service
- **Helmet** - Security headers

### External Services
- **MongoDB Atlas** - Cloud database
- **Firebase Auth** - Authentication service
- **India Post API** - Pincode validation
- **Gmail SMTP** - Email notifications
- **Vercel** - Frontend hosting
- **Render** - Backend hosting

## 📱 Features Overview

### Customer Features
- ✅ User registration and authentication
- ✅ Product browsing with search and filters
- ✅ Shopping cart management
- ✅ Secure checkout process
- ✅ Order tracking and history
- ✅ Profile management
- ✅ Address management with pincode validation

### Seller Features
- ✅ Seller registration with document upload
- ✅ Business verification process
- ✅ Product catalog management
- ✅ Order management and fulfillment
- ✅ Sales analytics dashboard
- ✅ Profile and business information updates
- ✅ Automated address validation

### Admin Features
- ✅ Seller approval and management
- ✅ Product moderation
- ✅ Order oversight
- ✅ User management
- ✅ Analytics and reporting
- ✅ System configuration

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt with salt
- **Input Validation** and sanitization
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for cross-origin security
- **Helmet.js** for security headers
- **MongoDB Injection** protection
- **XSS Protection** with input sanitization

## 📊 Performance Optimizations

- **Code Splitting** with React lazy loading
- **Image Optimization** with lazy loading
- **Database Indexing** for faster queries
- **Caching Strategies** for API responses
- **Compression** for reduced payload sizes
- **CDN Integration** for static assets

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# E2E tests
npm run test:e2e
```

## 📈 Deployment

### Production Deployment

1. **Backend (Render)**
   ```bash
   # Set environment variables in Render dashboard
   # Deploy from GitHub repository
   ```

2. **Frontend (Vercel)**
   ```bash
   # Connect GitHub repository
   # Set environment variables
   # Auto-deploy on push
   ```

3. **Database (MongoDB Atlas)**
   ```bash
   # Create cluster
   # Configure network access
   # Set up database user
   ```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **India Post Office** for providing the pincode API
- **Firebase** for authentication services
- **MongoDB** for database solutions
- **Vercel & Render** for hosting platforms
- **Open Source Community** for amazing tools and libraries

## 📞 Support

- **Documentation**: [LEARN.md](./LEARN.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ecommerce-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ecommerce-platform/discussions)

## 🗺️ Roadmap

- [ ] **Mobile App** - React Native implementation
- [ ] **Payment Gateway** - Razorpay/Stripe integration
- [ ] **Inventory Management** - Advanced stock tracking
- [ ] **Analytics Dashboard** - Advanced reporting
- [ ] **Multi-language Support** - Internationalization
- [ ] **PWA Features** - Offline functionality
- [ ] **AI Recommendations** - ML-based product suggestions

---

**Built with ❤️ for the Indian e-commerce ecosystem**

*Leveraging government APIs for accurate address validation and seamless user experience*