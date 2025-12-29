# Deployment Guide

This guide will help you deploy the E-commerce application with the frontend on Vercel and the backend on Render.

## Prerequisites

1. **MongoDB Atlas Account**: Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Firebase Project**: Set up Firebase Authentication at [Firebase Console](https://console.firebase.google.com/)
3. **Vercel Account**: Sign up at [Vercel](https://vercel.com/)
4. **Render Account**: Sign up at [Render](https://render.com/)
5. **Gmail Account**: For email notifications (optional)

## Backend Deployment (Render)

### 1. Prepare Environment Variables

Copy `server/.env.example` to `server/.env` and fill in your values:

```bash
# Database - MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Secrets - Generate random 32+ character strings
JWT_SECRET=your_super_long_random_jwt_secret_here_32_chars_min
JWT_REFRESH_SECRET=your_super_long_random_refresh_secret_here_32_chars_min

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id

# Frontend URL (will be your Vercel domain)
CLIENT_URL=https://your-app.vercel.app

# Email (optional - for seller notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### 2. Deploy to Render

1. **Connect Repository**: 
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

2. **Configure Service**:
   - **Name**: `ecommerce-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Environment Variables**:
   Add all the variables from your `.env` file in the Render dashboard:
   - Go to "Environment" tab
   - Add each variable from your `.env` file
   - **Important**: Set `NODE_ENV=production`

4. **Deploy**: Click "Create Web Service"

### 3. Get Backend URL

After deployment, you'll get a URL like: `https://your-app-name.onrender.com`

## Frontend Deployment (Vercel)

### 1. Prepare Environment Variables

Copy `client/.env.example` to `client/.env` and update:

```bash
# API URL - Your Render backend URL
VITE_API_URL=https://your-backend-name.onrender.com/api

# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 2. Deploy to Vercel

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables**:
   Add all variables from your `client/.env` file:
   - Go to "Settings" → "Environment Variables"
   - Add each `VITE_*` variable

4. **Deploy**: Click "Deploy"

### 3. Update Backend CORS

After getting your Vercel URL (e.g., `https://your-app.vercel.app`):

1. Go to Render dashboard
2. Update `CLIENT_URL` environment variable to your Vercel URL
3. Redeploy the backend service

## Database Setup

### 1. MongoDB Atlas

1. **Create Cluster**: 
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a free cluster
   - Choose a region close to your users

2. **Database User**:
   - Go to "Database Access"
   - Add a new database user
   - Choose "Password" authentication
   - Save username and password for connection string

3. **Network Access**:
   - Go to "Network Access"
   - Add IP Address: `0.0.0.0/0` (allow from anywhere)
   - Or add specific IPs for better security

4. **Connection String**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

### 2. Firebase Setup

1. **Create Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Google Analytics (optional)

2. **Authentication**:
   - Go to "Authentication" → "Sign-in method"
   - Enable "Email/Password"
   - Enable "Google" (optional)

3. **Web App**:
   - Go to "Project Settings" → "General"
   - Add a web app
   - Copy the configuration values

4. **Service Account** (for backend):
   - Go to "Project Settings" → "Service accounts"
   - Generate new private key
   - Download the JSON file
   - Extract values for environment variables

## Testing Deployment

### 1. Backend Health Check

Visit: `https://your-backend.onrender.com/api/health`

Should return:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 2. Frontend

Visit your Vercel URL and test:
- User registration/login
- Product browsing
- Seller registration
- Admin login (if configured)

## Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
CLIENT_URL=https://your-app.vercel.app
EMAIL_USER=...
EMAIL_PASS=...
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend.onrender.com/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure `CLIENT_URL` in backend matches your Vercel domain
2. **Database Connection**: Check MongoDB Atlas network access and connection string
3. **Firebase Errors**: Verify all Firebase configuration values
4. **Build Failures**: Check build logs in Vercel/Render dashboards

### Logs

- **Render**: Go to your service → "Logs" tab
- **Vercel**: Go to your project → "Functions" tab → View logs

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (32+ characters)
3. **Restrict MongoDB network access** to specific IPs if possible
4. **Use Firebase security rules** for additional protection
5. **Enable HTTPS only** in production

## Scaling

### Free Tier Limitations

- **Render**: 750 hours/month, sleeps after 15 minutes of inactivity
- **Vercel**: 100GB bandwidth, 6000 minutes build time
- **MongoDB Atlas**: 512MB storage

### Upgrade Options

- **Render**: Paid plans start at $7/month for always-on services
- **Vercel**: Pro plan at $20/month for teams
- **MongoDB Atlas**: Paid clusters for more storage and features