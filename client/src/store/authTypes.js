// Authentication types and constants
export const AUTH_TYPES = {
  USER: 'user',
  ADMIN: 'admin', 
  SELLER: 'seller'
}

export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  ADMIN_TOKEN: 'adminToken', 
  ADMIN_DATA: 'adminData',
  SELLER_TOKEN: 'sellerToken',
  SELLER_DATA: 'sellerData'
}

export const API_ENDPOINTS = {
  USER_LOGIN: '/auth/login',
  USER_REGISTER: '/auth/register',
  ADMIN_LOGIN: '/admin/login',
  SELLER_LOGIN: '/seller/login',
  SELLER_REGISTER: '/seller/register'
}