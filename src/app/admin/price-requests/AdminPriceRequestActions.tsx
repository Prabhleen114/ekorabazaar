'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPriceRequestActions({ request }: { request: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!confirm(`Are you sure you want to ${action} this price change?`)) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/price-requests/${request.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const data = await res.json()
      if (data.success) {
        router.refresh()
      } else {
        alert(data.error || 'Failed to process request')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 justify-end">
      <button 
        onClick={() => handleAction('APPROVE')} 
        disabled={loading}
        className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold disabled:opacity-50"
      >
        Approve
      </button>
      <button 
        onClick={() => handleAction('REJECT')} 
        disabled={loading}
        className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  )
}
