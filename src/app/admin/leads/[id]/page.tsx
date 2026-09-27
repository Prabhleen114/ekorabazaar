'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPaise(n: number | null | undefined): string {
  if (n == null) return 'N/A'
  const num = Number(n)
  if (isNaN(num)) return 'N/A'
  return 'Rs. ' + (num / 100).toFixed(2)
}

export default function AdminLeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!id) return
    fetchLead()
  }, [id])

  async function fetchLead() {
    try {
      const res = await fetch('/api/admin/orders/' + id)
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Admin session expired.')
        }
        throw new Error('Failed to fetch lead details.')
      }
      const data = await res.json()
      
      // If it's no longer PAYMENT_PENDING, redirect back to orders (it was paid)
      if (data.order && data.order.status !== 'PAYMENT_PENDING') {
        router.push('/admin/orders/' + id)
        return
      }

      setLead(data.order)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading lead')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading lead details...</div>
  if (errorMsg) return <div className="p-8 text-red-600">{errorMsg}</div>
  if (!lead) return <div className="p-8 text-gray-500">Lead not found.</div>

  const address = lead.addressSnapshot as Record<string, string> | null
  const custEmail = lead.customer?.email || 'N/A'

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checkout Lead</h1>
          <p className="text-sm text-gray-500 font-mono mt-1">{lead.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase">
            Payment Pending
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer & Address Details */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Email</p>
                <p className="font-medium">{custEmail}</p>
              </div>
              {address && (
                <>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Name</p>
                    <p className="font-medium">{address.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Phone</p>
                    <p className="font-medium">{address.phone}</p>
                  </div>
                  <div className="sm:col-span-2 mt-2">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Shipping Address</p>
                    <p className="font-medium">{address.line1}</p>
                    {address.line2 && <p>{address.line2}</p>}
                    <p>{address.city}, {address.state} - {address.pincode}</p>
                    <p>{address.country}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-700 uppercase">Cart Items</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {lead.items?.map((item: any) => (
                <li key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.productNameSnapshot || 'Unknown Product'}</p>
                    <div className="text-xs text-gray-500 mt-1 space-x-2">
                      <span>Qty: <strong className="text-gray-700">{item.quantity}</strong></span>
                      <span>&middot;</span>
                      <span>Price: {formatPaise(item.priceSnapshot)}</span>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {formatPaise(item.subtotal)}
                  </div>
                </li>
              ))}
            </ul>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-sm">
              <span className="font-bold text-gray-700 uppercase">Total Amount</span>
              <span className="text-lg font-bold text-gray-900">{formatPaise(lead.total)}</span>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          
          {/* Timeline / Basic Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase mb-4">Lead Info</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Created At</span>
                <span className="font-medium text-gray-900 text-right">
                  {new Date(lead.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Currency</span>
                <span className="font-medium text-gray-900">{lead.currency}</span>
              </div>
            </div>
          </div>

          {/* Payment Attempts */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase mb-4">Payment Attempts</h2>
            {lead.payments?.length === 0 ? (
              <p className="text-sm text-gray-500">No payment records created yet.</p>
            ) : (
              <ul className="space-y-3">
                {lead.payments?.map((pay: any) => {
                  let badge = 'bg-gray-100 text-gray-600'
                  if (pay.status === 'CAPTURED') badge = 'bg-green-100 text-green-800'
                  if (pay.status === 'FAILED') badge = 'bg-red-100 text-red-800'
                  if (pay.status === 'PENDING') badge = 'bg-yellow-100 text-yellow-800'

                  return (
                    <li key={pay.id} className="text-sm border border-gray-100 rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-xs text-gray-500">{pay.razorpayOrderId || 'No PG ID'}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge}`}>
                          {pay.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-2">
                        <span>{formatPaise(pay.amount)}</span>
                        <span>{new Date(pay.createdAt).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' })}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}
