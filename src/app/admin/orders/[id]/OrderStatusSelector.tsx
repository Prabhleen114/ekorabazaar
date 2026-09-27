'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCustomerFacingOrderStatus } from '@/lib/orders'

export default function OrderStatusSelector({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const VALID_STATUSES = [
    'PAYMENT_PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 
    'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REFUND_INITIATED', 'REFUNDED'
  ]

  const handleUpdate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update status')
      }

      setShowConfirm(false)
      router.refresh()
      // Optional: reload the page to get the updated status history on this page if it's client fetched
      window.location.reload()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-800">
          Update order status to <span className="font-bold">{getCustomerFacingOrderStatus(selectedStatus as any)}</span>?
          {error && <span className="block text-red-500 mt-1">{error}</span>}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setShowConfirm(false); setSelectedStatus(currentStatus); setError(null); }}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md bg-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpdate}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-white bg-brand-orange hover:bg-brand-terracotta rounded-md disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Confirm'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={selectedStatus}
        onChange={(e) => {
          setSelectedStatus(e.target.value)
          if (e.target.value !== currentStatus) {
            setShowConfirm(true)
          }
        }}
        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
      >
        {VALID_STATUSES.map(s => (
          <option key={s} value={s}>{getCustomerFacingOrderStatus(s as any)}</option>
        ))}
      </select>
    </div>
  )
}
