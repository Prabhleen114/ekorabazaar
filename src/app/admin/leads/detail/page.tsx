'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import OrderAdminNotes, { AdminOrderNoteItem } from '@/app/admin/orders/detail/OrderAdminNotes'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

interface LeadItemSnapshot {
  productId?: string
  productName?: string
  quantity: number
  unitPricePaise: number
  subtotalPaise: number
}

interface LeadOrderItem {
  productId: string
  productNameSnapshot?: string
  quantity: number
  priceSnapshot: number
  subtotal: number
}

interface LeadPaymentItem {
  id: string
  razorpayOrderId?: string | null
  status: string
  failureReason?: string | null
  amount: number
  createdAt: string
}

interface AdminLeadDetail {
  id: string
  source: string
  status: string
  orderId?: string | null
  convertedOrderId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  reason?: string | null
  currency?: string
  orderValue?: number
  createdAt: string
  lastActivityAt?: string | null
  itemsSnapshot?: LeadItemSnapshot[] | null
  order?: {
    addressSnapshot?: Record<string, string> | null
    items?: LeadOrderItem[]
    payments?: LeadPaymentItem[]
    adminNotes?: AdminOrderNoteItem[]
  } | null
}

function formatPaise(n: number | null | undefined): string {
  if (n == null) return 'N/A'
  const num = Number(n)
  if (isNaN(num)) return 'N/A'
  return 'Rs. ' + (num / 100).toFixed(2)
}

function sourceLabel(source: string): string {
  if (source === 'CANCELLED_ORDER') return 'Cancelled Order'
  if (source === 'INCOMPLETE_CHECKOUT') return 'Incomplete Checkout'
  if (source === 'ABANDONED_CHECKOUT') return 'Abandoned Checkout'
  return source
}

function AdminLeadDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const id = searchParams.get('id') || pathname.split('/').filter(Boolean).pop() || ''

  const [lead, setLead] = useState<AdminLeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  const fetchLead = useCallback(async () => {
    if (!id || id === 'detail') return
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/leads/' + id, { cache: 'no-store' })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Admin session expired.')
        }
        throw new Error('Failed to fetch lead details.')
      }
      const data = await res.json()
      setLead(data.lead)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error loading lead')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLead()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchLead])

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return
    setUpdatingStatus(true)
    setStatusMsg('')
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update lead status')
      setLead((prev) => (prev ? { ...prev, status: data.lead.status } : prev))
      setStatusMsg(`Lead status updated to ${data.lead.status}.`)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading lead details...</div>
  if (errorMsg) return <div className="p-8 text-red-600">{errorMsg}</div>
  if (!lead) return <div className="p-8 text-gray-500">Lead not found.</div>

  const address = lead.order?.addressSnapshot || null
  const items: LeadItemSnapshot[] = Array.isArray(lead.itemsSnapshot) && lead.itemsSnapshot.length > 0
    ? lead.itemsSnapshot
    : (lead.order?.items || []).map((i) => ({
        productId: i.productId,
        productName: i.productNameSnapshot,
        quantity: i.quantity,
        unitPricePaise: i.priceSnapshot,
        subtotalPaise: i.subtotal,
      }))

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => router.push('/admin/leads')}
          className="inline-flex items-center gap-1.5 text-orange-600 hover:underline text-sm font-medium mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900">Lead Details</h1>
              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">
                {sourceLabel(lead.source)}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1">{lead.id}</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold uppercase text-gray-500">Lead Status</label>
            <select
              value={lead.status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 text-sm font-semibold border border-gray-300 rounded-lg bg-white"
            >
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="CONVERTED">CONVERTED</option>
              <option value="LOST">LOST</option>
            </select>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          {statusMsg}
        </div>
      )}

      {lead.convertedOrderId && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm font-bold">Customer Converted!</p>
              <p className="text-xs text-emerald-700">
                This lead subsequently completed checkout (Order #{lead.convertedOrderId.slice(0, 8)}).
              </p>
            </div>
          </div>
          <Link
            href={`/admin/orders/${lead.convertedOrderId}`}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800"
          >
            View Confirmed Order &rarr;
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Address Details */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Name</p>
                <p className="font-medium">{lead.customerName || address?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Email</p>
                <p className="font-medium break-all">{lead.customerEmail || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Phone</p>
                <p className="font-medium font-mono">{lead.customerPhone || address?.phone || 'N/A'}</p>
              </div>
              {lead.reason && (
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Reason / Stage</p>
                  <p className="font-medium text-red-700">{lead.reason}</p>
                </div>
              )}
              {address && (
                <div className="sm:col-span-2 mt-2 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Shipping Address</p>
                  <p className="font-medium">{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {[address.city, address.state, address.pincode].filter(Boolean).join(', ')}
                  </p>
                  <p>{address.country}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-700 uppercase">Products &amp; Quantities</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <li className="p-6 text-sm text-gray-500 text-center">No product items captured.</li>
              ) : (
                items.map((item, idx) => (
                  <li key={idx} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.productName || 'Unknown Product'}
                      </p>
                      <div className="text-xs text-gray-500 mt-1 space-x-2">
                        <span>
                          Qty: <strong className="text-gray-700">{item.quantity}</strong>
                        </span>
                        <span>&middot;</span>
                        <span>Unit Price: {formatPaise(item.unitPricePaise)}</span>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatPaise(item.subtotalPaise)}
                    </div>
                  </li>
                ))
              )}
            </ul>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-sm">
              <span className="font-bold text-gray-700 uppercase">Order / Cart Value</span>
              <span className="text-lg font-bold text-gray-900">{formatPaise(lead.orderValue)}</span>
            </div>
          </div>

          {lead.orderId && (
            <OrderAdminNotes
              orderId={lead.orderId}
              initialNotes={lead.order?.adminNotes || []}
            />
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase mb-4">Lead Metadata</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Created</span>
                <span className="font-medium text-gray-900 text-right">
                  {new Date(lead.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Last Activity</span>
                <span className="font-medium text-gray-900 text-right">
                  {new Date(lead.lastActivityAt || lead.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Currency</span>
                <span className="font-medium text-gray-900">{lead.currency || 'INR'}</span>
              </div>
              {lead.orderId && (
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">Linked Order ID</span>
                  <span className="font-mono text-xs text-gray-700">{lead.orderId.slice(0, 12)}...</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Attempts */}
          {lead.order && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-700 uppercase mb-4">Payment History</h2>
              {!lead.order.payments || lead.order.payments.length === 0 ? (
                <p className="text-sm text-gray-500">No payment records created yet.</p>
              ) : (
                <ul className="space-y-3">
                  {lead.order.payments.map((pay) => {
                    let badge = 'bg-gray-100 text-gray-600'
                    if (pay.status === 'CAPTURED') badge = 'bg-green-100 text-green-800'
                    if (pay.status === 'FAILED') badge = 'bg-red-100 text-red-800'
                    if (pay.status === 'PENDING') badge = 'bg-yellow-100 text-yellow-800'

                    return (
                      <li key={pay.id} className="text-sm border border-gray-100 rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono text-xs text-gray-500">
                            {pay.razorpayOrderId || 'No PG ID'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge}`}>
                            {pay.status}
                          </span>
                        </div>
                        {pay.failureReason && (
                          <div className="text-xs text-red-600 mt-1">{pay.failureReason}</div>
                        )}
                        <div className="flex justify-between text-xs text-gray-600 mt-2">
                          <span>{formatPaise(pay.amount)}</span>
                          <span>
                            {new Date(pay.createdAt).toLocaleString('en-IN', {
                              timeStyle: 'short',
                              dateStyle: 'short',
                            })}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminLeadDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading lead details...</div>}>
      <AdminLeadDetailContent />
    </Suspense>
  )
}
