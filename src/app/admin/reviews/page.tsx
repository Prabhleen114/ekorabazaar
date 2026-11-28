'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  RefreshCw,
  ShieldCheck,
  Clock,
  ExternalLink,
  AlertCircle,
  Filter,
} from 'lucide-react'

type StatusTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

interface AdminReviewRow {
  id: string
  productId: string
  productTitle: string
  productImage: string | null
  productCategory: string | null
  productAverageRating: number
  productReviewCount: number
  rating: number
  title: string | null
  comment: string
  reviewerName: string | null
  customerName: string | null
  customerEmail: string | null
  orderId: string | null
  orderItemId: string | null
  isVerifiedPurchase: boolean
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  moderationNote: string | null
  moderatedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ReviewedProductOption {
  id: string
  title: string
}

function statusBadgeClass(status: AdminReviewRow['status']): string {
  if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (status === 'REJECTED') return 'bg-red-100 text-red-800 border-red-200'
  return 'bg-amber-100 text-amber-900 border-amber-300'
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'fill-amber-400 text-amber-500' : 'fill-gray-100 text-gray-300'
          }`}
        />
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewRow[]>([])
  const [counts, setCounts] = useState({ ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 })
  const [overallStats, setOverallStats] = useState({ approvedAverageRating: 0, approvedCount: 0 })
  const [products, setProducts] = useState<ReviewedProductOption[]>([])

  const [activeTab, setActiveTab] = useState<StatusTab>('ALL')
  const [productFilter, setProductFilter] = useState('ALL')
  const [ratingFilter, setRatingFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalMatched, setTotalMatched] = useState(0)

  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (activeTab !== 'ALL') params.set('status', activeTab)
      if (productFilter !== 'ALL') params.set('productId', productFilter)
      if (ratingFilter !== 'ALL') params.set('rating', ratingFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (searchQuery.trim()) params.set('q', searchQuery.trim())

      const res = await fetch('/api/admin/reviews?' + params.toString(), { cache: 'no-store' })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Admin session expired. Please log in again.')
        }
        throw new Error('Failed to load reviews.')
      }

      const data = await res.json()
      setReviews(data.reviews || [])
      if (data.counts) setCounts(data.counts)
      if (data.overallStats) setOverallStats(data.overallStats)
      if (data.products) setProducts(data.products)
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalMatched(data.pagination?.total || 0)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error loading reviews')
    } finally {
      setLoading(false)
    }
  }, [page, activeTab, productFilter, ratingFilter, dateFrom, dateTo, searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchReviews()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchReviews])

  const handleModerate = async (reviewId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionId(reviewId)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/admin/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update review')
      }
      setSuccessMsg(`Review ${status === 'APPROVED' ? 'approved and published' : 'rejected'}.`)
      setTimeout(() => setSuccessMsg(''), 3000)
      await fetchReviews()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Moderation failed')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (reviewId: string) => {
    setActionId(reviewId)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/admin/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete review')
      }
      setConfirmDeleteId(null)
      setSuccessMsg('Review deleted permanently.')
      setTimeout(() => setSuccessMsg(''), 3000)
      await fetchReviews()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setActionId(null)
    }
  }

  const clearFilters = () => {
    setActiveTab('ALL')
    setProductFilter('ALL')
    setRatingFilter('ALL')
    setDateFrom('')
    setDateTo('')
    setSearchInput('')
    setSearchQuery('')
    setPage(1)
  }

  const tabs: { key: StatusTab; label: string; count: number }[] = [
    { key: 'ALL', label: 'All Reviews', count: counts.ALL },
    { key: 'PENDING', label: 'Pending Moderation', count: counts.PENDING },
    { key: 'APPROVED', label: 'Approved', count: counts.APPROVED },
    { key: 'REJECTED', label: 'Rejected', count: counts.REJECTED },
  ]

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            Moderate customer reviews, verify purchase status, and track product ratings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchReviews()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          className={`p-4 rounded-xl border shadow-xs ${
            counts.PENDING > 0
              ? 'bg-amber-50 border-amber-300'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
            <span>Pending Reviews</span>
            <Clock className={`w-4 h-4 ${counts.PENDING > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{counts.PENDING}</div>
          {counts.PENDING > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('PENDING')
                setPage(1)
              }}
              className="mt-1 text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
            >
              Review pending queue &rarr;
            </button>
          )}
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
            <span>Published Average</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {overallStats.approvedCount > 0 ? `${overallStats.approvedAverageRating.toFixed(1)} / 5` : '—'}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Across {overallStats.approvedCount} approved{' '}
            {overallStats.approvedCount === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{counts.APPROVED}</div>
          <p className="text-xs text-gray-500 mt-1">Live on product pages</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
            <span>Total / Rejected</span>
            <XCircle className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {counts.ALL}{' '}
            <span className="text-sm font-medium text-red-600">({counts.REJECTED} rejected)</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">All submitted feedback</p>
        </div>
      </div>

      {/* Feedback Banners */}
      {errorMsg && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          const isPendingAlert = tab.key === 'PENDING' && tab.count > 0 && !isActive
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key)
                setPage(1)
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-gray-900 text-white border-gray-900'
                  : isPendingAlert
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-white text-gray-900'
                    : isPendingAlert
                    ? 'bg-amber-200 text-amber-950'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Reviews</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setPage(1)
              setSearchQuery(searchInput)
            }}
            className="lg:col-span-2 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search customer, email, product, order..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-black cursor-pointer"
            >
              Search
            </button>
          </form>

          <select
            aria-label="Filter by product"
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="ALL">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by rating"
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="ALL">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <input
            type="date"
            aria-label="From date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
          />

          <div className="flex gap-2">
            <input
              type="date"
              aria-label="To date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPage(1)
              }}
              className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            />
            <button
              type="button"
              onClick={clearFilters}
              className="px-2.5 py-2 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 shrink-0 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">
          No reviews match the selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const isBusy = actionId === r.id
            const isPending = r.status === 'PENDING'
            const isConfirmDelete = confirmDeleteId === r.id

            return (
              <div
                key={r.id}
                className={`bg-white rounded-xl border shadow-xs p-5 transition-colors ${
                  isPending ? 'border-l-4 border-l-amber-500 border-amber-200' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Content & Metadata */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    {/* Top badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <StarDisplay rating={r.rating} />

                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadgeClass(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>

                      {r.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Verified Purchase
                        </span>
                      )}

                      <span className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    {/* Product + Product Avg Rating */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-gray-500">Product:</span>
                      <Link
                        href={`/products/${encodeURIComponent(r.productId)}`}
                        target="_blank"
                        className="font-semibold text-gray-900 hover:text-orange-600 inline-flex items-center gap-1"
                      >
                        <span>{r.productTitle}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-600">
                        Avg:{' '}
                        <strong>
                          {r.productReviewCount > 0 ? `${r.productAverageRating.toFixed(1)}★` : 'No published'}
                        </strong>{' '}
                        ({r.productReviewCount} published)
                      </span>
                    </div>

                    {/* Title & Comment */}
                    {r.title && <h3 className="font-bold text-base text-gray-900">{r.title}</h3>}
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                      {r.comment}
                    </p>

                    {/* Customer & Order Reference */}
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-600">
                      <div>
                        <span className="text-gray-400">Customer:</span>{' '}
                        <strong className="text-gray-800">{r.customerName || 'Anonymous'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400">Email:</span>{' '}
                        <span className="font-mono text-gray-800">
                          {r.customerEmail || 'Not provided'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Order Ref:</span>{' '}
                        {r.orderId ? (
                          <Link
                            href={`/admin/orders/detail?id=${encodeURIComponent(r.orderId)}`}
                            className="font-mono text-orange-700 hover:underline font-semibold"
                          >
                            {r.orderId}
                          </Link>
                        ) : (
                          <span className="text-gray-400">Direct / No order linked</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Moderation Actions */}
                  <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 shrink-0">
                    {r.status !== 'APPROVED' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleModerate(r.id, 'APPROVED')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {r.status !== 'REJECTED' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleModerate(r.id, 'REJECTED')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}

                    {isConfirmDelete ? (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg text-xs">
                        <span className="text-red-800 font-semibold">Delete?</span>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleDelete(r.id)}
                          className="font-bold text-red-700 hover:text-red-900 cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setConfirmDeleteId(r.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing page {page} of {totalPages} ({totalMatched} reviews)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
