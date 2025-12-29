import React, { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { useUserAuthStore } from '../../store/userAuthStore'
import { apiClient } from '../../api/client'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const [confirmText, setConfirmText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user, userLogout } = useUserAuthStore()
  const navigate = useNavigate()

  const expectedText = 'DELETE MY ACCOUNT'
  const isConfirmValid = confirmText === expectedText

  const handleDeleteAccount = async () => {
    if (!isConfirmValid) {
      toast.error('Please type the confirmation text correctly')
      return
    }

    setIsLoading(true)
    
    try {
      await apiClient.delete('/users/profile')
      
      toast.success('Account deleted successfully')
      userLogout()
      navigate('/')
      onClose()
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete account'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmText('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Account"
      size="medium"
    >
      <div className="space-y-6">
        {/* Warning */}
        <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              This action cannot be undone
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Deleting your account will permanently remove all your data, including:
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 mt-2 list-disc list-inside space-y-1">
              <li>Profile information and settings</li>
              <li>Order history and tracking</li>
              <li>Wishlist and saved items</li>
              <li>Addresses and payment methods</li>
              <li>Reviews and ratings</li>
            </ul>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Account to be deleted:
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Name:</strong> {user?.displayName || 'Not provided'}</p>
            <p><strong>Customer ID:</strong> {user?.customerId}</p>
            <p><strong>Member since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
          </div>
        </div>

        {/* Confirmation Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            To confirm deletion, type <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-red-600 dark:text-red-400">{expectedText}</span> below:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${
              confirmText && !isConfirmValid
                ? 'border-red-500 focus:ring-red-500'
                : confirmText && isConfirmValid
                ? 'border-green-500 focus:ring-green-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
            }`}
            placeholder={expectedText}
          />
          {confirmText && !isConfirmValid && (
            <p className="mt-1 text-sm text-red-600">
              Text doesn't match. Please type exactly: {expectedText}
            </p>
          )}
          {isConfirmValid && (
            <p className="mt-1 text-sm text-green-600">
              Confirmation text is correct
            </p>
          )}
        </div>

        {/* Alternative Options */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Consider these alternatives:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Temporarily deactivate your account instead</li>
            <li>• Download your data before deleting</li>
            <li>• Contact support if you have concerns</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            disabled={!isConfirmValid || isLoading}
            isLoading={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account Permanently
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default DeleteAccountModal