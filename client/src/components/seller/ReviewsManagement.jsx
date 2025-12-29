import React, { useState, useEffect } from 'react'
import { Star, MessageSquare, User, Package, Calendar, Reply, Send, Filter, Search } from 'lucide-react'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'
import { apiClient } from '../../api/client'
import { getImageUrl } from '../../utils/imageUtils'
import toast from 'react-hot-toast'

const SellerReviewsManagement = () => {
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [stats, setStats] = useState({
    total: 0,
    withReply: 0,
    withoutReply: 0,
    averageRating: 0
  })
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [pagination.page, statusFilter, ratingFilter])

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (pagination.page === 1) {
        fetchReviews()
      } else {
        setPagination(prev => ({ ...prev, page: 1 }))
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (ratingFilter !== 'all') {
        params.append('rating', ratingFilter)
      }

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await apiClient.get(`/simple-reviews/seller/my-products?${params.toString()}`)
      
      setReviews(response.data.reviews)
      setPagination(response.data.pagination)
      
      // Calculate stats
      const totalReviews = response.data.reviews
      const withReply = totalReviews.filter(r => r.hasReply).length
      const averageRating = totalReviews.length > 0 
        ? totalReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews.length 
        : 0

      setStats({
        total: response.data.pagination.total,
        withReply,
        withoutReply: response.data.pagination.total - withReply,
        averageRating: averageRating.toFixed(1)
      })
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
      if (error.response?.status === 403) {
        toast.error('Access denied. Please log in as seller.')
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in.')
      } else {
        toast.error(error.response?.data?.message || 'Failed to load reviews')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleReply = async (productId, reviewId) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply message')
      return
    }

    try {
      setIsSubmittingReply(true)
      
      const response = await apiClient.post(`/simple-reviews/seller/reply/${productId}/${reviewId}`, {
        reply: replyText.trim()
      })

      if (response.data.success) {
        // Update the review in local state
        setReviews(reviews.map(review => 
          review._id === reviewId 
            ? { 
                ...review, 
                hasReply: true,
                sellerReply: {
                  message: replyText.trim(),
                  repliedAt: new Date().toISOString()
                }
              }
            : review
        ))
        
        // Update stats
        setStats(prev => ({
          ...prev,
          withReply: prev.withReply + 1,
          withoutReply: prev.withoutReply - 1
        }))
        
        toast.success('Reply added successfully!')
        setReplyingTo(null)
        setReplyText('')
      }
    } catch (error) {
      console.error('Failed to add reply:', error)
      toast.error(error.response?.data?.message || 'Failed to add reply')
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

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600 bg-green-100'
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (isLoading && reviews.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Reviews</h2>
          <p className="text-gray-600">Manage reviews for your products</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Reply className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Replied</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withReply}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reply</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withoutReply}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search reviews, products, or customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="replied">With Reply</option>
            <option value="pending">Pending Reply</option>
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
            <p className="text-gray-600">No reviews found for your products yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <div key={review._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={getImageUrl(review.productImage) || '/placeholder-product.png'}
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRatingColor(review.rating)}`}>
                          {review.rating} ★
                        </span>
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
                        {review.user?.displayName || 'Anonymous'} ({review.user?.email || 'N/A'})
                      </span>
                    </div>

                    {/* Review Content */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                    </div>

                    {/* Seller Reply */}
                    {review.sellerReply && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg mb-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Reply className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Your Reply</span>
                          <span className="text-xs text-blue-600">
                            {formatDate(review.sellerReply.repliedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-blue-700">{review.sellerReply.message}</p>
                      </div>
                    )}

                    {/* Reply Form */}
                    {replyingTo === review._id ? (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Reply
                          </label>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Write your reply to this review..."
                          />
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            onClick={() => handleReply(review.productId, review._id)}
                            disabled={isSubmittingReply || !replyText.trim()}
                            size="small"
                          >
                            {isSubmittingReply ? (
                              <>
                                <LoadingSpinner size="small" className="mr-2" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Send Reply
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyText('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Actions */
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            review.hasReply 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {review.hasReply ? 'Replied' : 'Pending Reply'}
                          </span>
                        </div>
                        
                        {!review.hasReply && (
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => setReplyingTo(review._id)}
                          >
                            <Reply className="h-4 w-4 mr-1" />
                            Reply
                          </Button>
                        )}
                      </div>
                    )}
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
                    
                    {/* Page numbers */}
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                      const pageNum = i + 1
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "primary" : "outline"}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className="border-l-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    
                    <Button
                      variant="outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="rounded-r-md border-l-0"
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

export default SellerReviewsManagement