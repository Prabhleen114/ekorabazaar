'use client'

import { useState } from 'react'

export default function AdminSellerActions({ seller }: { seller: any }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAction = async (action: 'approve' | 'reject' | 'suspend' | 'reactivate', payload: any = {}) => {
    if (!confirm(`Are you sure you want to ${action} this seller?`)) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/sellers/${seller.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Action failed')
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const promptReject = () => {
    const reason = prompt("Enter rejection reason:")
    if (reason) handleAction('reject', { rejectionReason: reason })
  }

  const promptSuspend = () => {
    const reason = prompt("Enter suspension reason:")
    if (reason) handleAction('suspend', { reason })
  }

  return (
    <div className="flex items-center space-x-2 justify-end">
      {error && <span className="text-red-500 text-xs">{error}</span>}
      
      {seller.applicationStatus === 'UNDER_REVIEW' && (
        <>
          <button 
            disabled={loading}
            onClick={() => handleAction('approve')}
            className="text-green-600 hover:text-green-900 text-sm font-medium disabled:opacity-50"
          >
            Approve
          </button>
          <button 
            disabled={loading}
            onClick={promptReject}
            className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
          >
            Reject
          </button>
        </>
      )}

      {seller.accountStatus === 'ACTIVE' && (
        <button 
          disabled={loading}
          onClick={promptSuspend}
          className="text-orange-600 hover:text-orange-900 text-sm font-medium disabled:opacity-50"
        >
          Suspend
        </button>
      )}

      {(seller.accountStatus === 'DISABLED' || seller.accountStatus === 'SUSPENDED') && seller.applicationStatus === 'APPROVED' && (
        <button 
          disabled={loading}
          onClick={() => handleAction('reactivate')}
          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium disabled:opacity-50"
        >
          Reactivate
        </button>
      )}
    </div>
  )
}
