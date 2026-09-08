'use client'

import { useState } from 'react'

export default function AdminProductActions({ product }: { product: any }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customerPrice, setCustomerPrice] = useState((product.price / 100).toFixed(2))

  const handleApprove = async () => {
    if (!confirm(`Approve product and publish at ₹${customerPrice}?`)) return
    
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/products/${product.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerPrice: Math.round(parseFloat(customerPrice) * 100) })
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to approve')
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    const reason = prompt("Enter rejection reason:")
    if (!reason) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/products/${product.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason })
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to reject')
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end space-y-2">
      {error && <span className="text-red-500 text-xs">{error}</span>}
      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-500">Cust. Price (₹):</label>
        <input 
          type="number" 
          value={customerPrice}
          onChange={e => setCustomerPrice(e.target.value)}
          className="border rounded px-2 py-1 text-sm w-24"
          min="0.01"
          step="0.01"
        />
      </div>
      <div className="flex space-x-2">
        <button 
          disabled={loading}
          onClick={handleApprove}
          className="text-green-600 hover:text-green-900 text-sm font-medium disabled:opacity-50"
        >
          Approve
        </button>
        <button 
          disabled={loading}
          onClick={handleReject}
          className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
