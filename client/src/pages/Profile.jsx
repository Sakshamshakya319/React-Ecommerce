import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Heart, Package, Settings, Edit2, Download, Lock, Trash2 } from 'lucide-react'
import { useUserAuthStore } from '../store/userAuthStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ChangePasswordModal from '../components/profile/ChangePasswordModal'
import DeleteAccountModal from '../components/profile/DeleteAccountModal'
import OrderHistory from '../components/profile/OrderHistory'
import { apiClient } from '../api/client'
import toast from 'react-hot-toast'

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: '',
    phoneNumber: '',
    profile: {
      firstName: '',
      lastName: '',
      bio: ''
    }
  })

  const { user, isLoading, updateProfile, fetchUserProfile } = useUserAuthStore()

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  useEffect(() => {
    if (user) {
      setEditForm({
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        profile: {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          bio: user.profile?.bio || ''
        }
      })
    }
  }, [user])

  const handleEditProfile = () => {
    setIsEditModalOpen(true)
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm)
      setIsEditModalOpen(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setEditForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setEditForm(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleDownloadData = async () => {
    try {
      const response = await apiClient.get('/users/download-data', {
        responseType: 'blob'
      })
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition']
      let filename = 'my-account-data.json'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Account data downloaded successfully!')
    } catch (error) {
      console.error('Download data error:', error)
      toast.error('Failed to download account data')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to view your profile
          </h2>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 text-white" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {user.displayName || 'User'}
              </h1>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Customer ID: {user.customerId}
              </p>
              <div className="flex items-center mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
                {user.role === 'admin' && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <Button
              variant="outline"
              onClick={handleEditProfile}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-md p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Profile Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                      
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Email</div>
                          <div className="font-medium">{user.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Phone</div>
                          <div className="font-medium">
                            {user.phoneNumber || 'Not provided'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Full Name</div>
                          <div className="font-medium">
                            {user.profile?.firstName && user.profile?.lastName
                              ? `${user.profile.firstName} ${user.profile.lastName}`
                              : user.displayName || 'Not provided'
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Account Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Account Details</h3>
                      
                      <div>
                        <div className="text-sm text-gray-600">Member Since</div>
                        <div className="font-medium">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600">Last Login</div>
                        <div className="font-medium">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600">Email Verified</div>
                        <div className="font-medium">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.isEmailVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {user.profile?.bio && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Bio</h3>
                      <p className="text-gray-700">{user.profile.bio}</p>
                    </div>
                  )}

                  {/* Addresses */}
                  {user.addresses && user.addresses.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Addresses</h3>
                      <div className="space-y-4">
                        {user.addresses.map((address, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                  <div className="font-medium capitalize">
                                    {address.type} Address
                                    {address.isDefault && (
                                      <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-gray-600 mt-1">
                                    {address.street}<br />
                                    {address.city}, {address.state} {address.zipCode}<br />
                                    {address.country}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <OrderHistory />
              )}

              {activeTab === 'wishlist' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Wishlist
                  </h2>
                  {user?.wishlist && user.wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {user.wishlist.map((product) => (
                        <div key={product._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0">
                              {product.images && product.images[0] ? (
                                <img
                                  src={product.images[0].url.startsWith('http') ? product.images[0].url : `http://localhost:5000${product.images[0].url}`}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    const canvas = document.createElement('canvas')
                                    canvas.width = 64
                                    canvas.height = 64
                                    const ctx = canvas.getContext('2d')
                                    ctx.fillStyle = '#6366f1'
                                    ctx.fillRect(0, 0, 64, 64)
                                    ctx.fillStyle = '#ffffff'
                                    ctx.font = '8px Arial'
                                    ctx.textAlign = 'center'
                                    ctx.fillText('IMG', 32, 32)
                                    e.target.src = canvas.toDataURL()
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Heart className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {product.category}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                                  ₹{product.price}
                                </span>
                                <Button
                                  size="small"
                                  variant="outline"
                                  onClick={() => window.open(`/products/${product._id}`, '_blank')}
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">Your wishlist is empty</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        Save items you love for later
                      </p>
                      <Button
                        variant="primary"
                        className="mt-4"
                        onClick={() => window.location.href = '/products'}
                      >
                        Browse Products
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Account Settings
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Notification Preferences */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Notification Preferences
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={user.preferences?.notifications?.email}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            readOnly
                          />
                          <span className="ml-2 text-gray-700">Email notifications</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={user.preferences?.notifications?.push}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            readOnly
                          />
                          <span className="ml-2 text-gray-700">Push notifications</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={user.preferences?.newsletter}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            readOnly
                          />
                          <span className="ml-2 text-gray-700">Newsletter subscription</span>
                        </label>
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Privacy & Security
                      </h3>
                      <div className="space-y-3">
                        <Button 
                          variant="outline"
                          onClick={() => setIsChangePasswordModalOpen(true)}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleDownloadData}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download My Data
                        </Button>
                        <Button 
                          variant="outline" 
                          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => setIsDeleteAccountModalOpen(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
        size="medium"
      >
        <div className="space-y-4">
          <Input
            label="Display Name"
            value={editForm.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            placeholder="Enter your display name"
          />
          
          <Input
            label="Phone Number"
            value={editForm.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            placeholder="Enter your phone number"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={editForm.profile.firstName}
              onChange={(e) => handleInputChange('profile.firstName', e.target.value)}
              placeholder="First name"
            />
            
            <Input
              label="Last Name"
              value={editForm.profile.lastName}
              onChange={(e) => handleInputChange('profile.lastName', e.target.value)}
              placeholder="Last name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              value={editForm.profile.bio}
              onChange={(e) => handleInputChange('profile.bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveProfile}
              isLoading={isLoading}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
      />
    </div>
  )
}

export default Profile