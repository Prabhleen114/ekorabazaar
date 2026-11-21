'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SellerOrdersPage() {
  const router = useRouter()
  const [data, setData] = useState<{ locked: boolean; accountStatus?: string; orders: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/seller/orders')
        if (res.status === 401 || res.status === 403) {
          router.push('/sell/start-selling')
          return
        }
        if (!res.ok) {
          throw new Error('Failed to load orders')
        }
        const json = await res.json()
        if (isMounted) {
          setData(json)
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error loading orders')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchOrders()
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

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
          {error || 'Unable to load orders.'}
        </div>
      </div>
    )
  }

  if (data.locked) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Commerce features locked</h3>
          <p className="mt-2 text-sm text-red-700">Your account must be ACTIVE to view and fulfill orders.</p>
        </div>
      </div>
    )
  }

  const orderItems = data.orders || []

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Customer Orders</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (Sold At)</th>
              <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orderItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.orderId ? `${item.orderId.substring(0, 8)}...` : 'N/A'}
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.productNameSnapshot}
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₹{((item.priceSnapshot || 0) / 100).toFixed(2)}
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.quantity}
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₹{((item.subtotal || 0) / 100).toFixed(2)}
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.order?.status || 'UNKNOWN'}
                  </span>
                </td>
              </tr>
            ))}
            
            {orderItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 md:px-6 py-12 text-center text-sm text-gray-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
