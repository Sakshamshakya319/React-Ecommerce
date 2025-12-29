import React, { useState, useEffect } from 'react'
import { Star, MessageSquare, User, Calendar, Reply, Send } from 'lucide-react'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'
import { apiClient } from '../../api/client'
import toast from 'react-hot-toast'

const SellerReviews = () => {
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchReviews()
  }, [pagination.page])

  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get(`/simple-reviews/seller/my-products?page=${pagination.page}&limit=${pagination.limit}`)
      
      setReviews(response.data.reviews)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReply = async (productId, reviewId) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply message')
      return
    }

    setIsSubmittingReply(true)
    try {
      await apiClient.post(`/simple-reviews/seller/reply/${productId}/${reviewId}`, {
        reply: replyText.trim()
      })

      toast.success('Reply sent successfully!')
      setReplyingTo(null)
      setReplyText('')
      fetchReviews() // Refresh to show the new reply
    } catch (error) {
      console.error('Failed to send reply:', error)
      toast.error(error.response?.data?.message || 'Failed to send reply')
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Reviews</h2>
          <p className="text-gray-600">Manage reviews for your products</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Reviews: {pagination.total}
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
            <p className="text-gray-600">Your products haven't received any reviews yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <div key={review._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={review.productImage || '/placeholder-product.svg'}
                      alt={review.productName}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {review.productName}
                        </h3>
                        {renderStars(review.rating)}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(review.createdAt)}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center space-x-2 mb-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {review.user.displayName}
                      </span>
                    </div>

                    {/* Review Content */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                    </div>

                    {/* Seller Reply */}
                    {review.sellerReply ? (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg mb-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Your Reply</span>
                          <span className="text-xs text-blue-600">
                            {formatDate(review.sellerReply.repliedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-blue-700">{review.sellerReply.message}</p>
                      </div>
                    ) : (
                      /* Reply Form */
                      <div className="mt-4">
                        {replyingTo === review._id ? (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-3">
                              <Reply className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-700">Reply to this review</span>
                            </div>
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write your reply to the customer..."
                              rows={3}
                              maxLength={500}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                            />
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-gray-500">
                                {replyText.length}/500 characters
                              </span>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="small"
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyText('')
                                  }}
                                  disabled={isSubmittingReply}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="primary"
                                  size="small"
                                  onClick={() => handleReply(review.productId, review._id)}
                                  isLoading={isSubmittingReply}
                                  disabled={!replyText.trim() || isSubmittingReply}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Send Reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => setReplyingTo(review._id)}
                          >
                            <Reply className="h-4 w-4 mr-1" />
                            Reply to Customer
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between mt-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        review.hasReply 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {review.hasReply ? 'Replied' : 'Awaiting Reply'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <Button
                      variant="outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="rounded-l-md"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="rounded-r-md"
                    >
                      Next
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerReviews