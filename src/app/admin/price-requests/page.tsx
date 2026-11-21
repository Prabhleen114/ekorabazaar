'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminPriceRequestActions from './AdminPriceRequestActions'
import ProductImageClient from '@/components/ProductImageClient'

export default function AdminPriceRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    const fetchRequests = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/price-requests')
        if (res.status === 401) {
          router.push('/')
          return
        }
        if (!res.ok) {
          throw new Error('Failed to load price requests')
        }
        const data = await res.json()
        if (isMounted) {
          setRequests(data.requests || [])
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error loading price requests')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchRequests()
    return () => {
      isMounted = false
    }
  }, [router])

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Price Change Requests</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="relative px-4 md:px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((req) => (
              <tr key={req.id}>
                <td className="px-4 md:px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-bg rounded overflow-hidden relative">
                    <ProductImageClient 
                      src={req.product?.imageUrl || '/og-image.jpg'} 
                      alt="Product" 
                      className="object-cover" 
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={req.product?.title}>{req.product?.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{req.product?.category}</div>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{req.seller?.brandName}</div>
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 line-through">Old: ₹{((req.oldPrice || 0) / 100).toFixed(2)}</div>
                  <div className="text-sm font-bold text-gray-900 mt-1">
                    New: ₹{((req.requestedPrice || 0) / 100).toFixed(2)}
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {req.reason || 'No reason provided'}
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <AdminPriceRequestActions request={req} />
                </td>
              </tr>
            ))}

            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 md:px-6 py-12 text-center text-sm text-gray-500">
                  No pending price change requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
