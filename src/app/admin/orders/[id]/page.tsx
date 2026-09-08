'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

function statusBadge(status: string) {
  switch (status) {
    case 'PAID': return 'bg-green-100 text-green-800'
    case 'PAYMENT_PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'CANCELLED': return 'bg-red-100 text-red-800'
    case 'CAPTURED': return 'bg-green-100 text-green-800'
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'FAILED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function paise(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return 'N/A'
  return '₹' + (Number(n) / 100).toFixed(2)
}

export default function AdminOrderDetailsPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetch(`/api/admin/orders/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => setOrder(data.order))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="p-8 text-gray-500">Loading order details…</div>
  }

  if (error || !order) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded mb-4">
          {error ? `Error: ${error}` : 'Order not found.'}
        </div>
        <button onClick={() => router.push('/admin/orders')} className="text-orange-600 hover:underline text-sm font-medium">
          ← Back to Orders
        </button>
      </div>
    )
  }

  // --- Data extraction using the actual Prisma field names ---
  const snap = order.addressSnapshot as Record<string, string> | null
  const customerEmail = order.customer?.email || 'N/A'
  const customerName = snap?.name || 'N/A'
  const customerPhone = snap?.phone || 'N/A'

  const payment = order.payments?.[0] ?? null

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/orders')}
          className="text-orange-600 hover:underline text-sm font-medium mb-4 inline-block"
        >
          ← Back to Orders
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-mono break-all">Order {order.id}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'medium' })}
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${statusBadge(order.status)}`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Items & Totals ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Items Ordered</h2>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Product</th>
                  <th className="p-4">Unit Price</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(order.items ?? []).map((item: any) => {
                  // Use the actual snapshot field names from the Prisma schema
                  const name = item.productNameSnapshot || item.productName || 'N/A'
                  const unitPaisee = item.priceSnapshot ?? item.price ?? null
                  const subtotalPaisee = item.subtotal ?? null
                  const qty = item.quantity ?? 0

                  return (
                    <tr key={item.id}>
                      <td className="p-4">
                        <div className="font-medium text-sm text-gray-900">{name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{item.productId}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{paise(unitPaisee)}</td>
                      <td className="p-4 text-sm text-gray-600">{qty}</td>
                      <td className="p-4 text-sm font-medium text-gray-900 text-right">
                        {paise(subtotalPaisee)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Totals footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{paise(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium">{paise(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="font-medium">{paise(order.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{paise(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar ───────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Customer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Customer</h2>
            </div>
            <div className="p-4 text-sm space-y-3">
              {[
                { label: 'Name', value: customerName },
                { label: 'Email', value: customerEmail },
                { label: 'Phone', value: customerPhone },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">{label}</div>
                  <div className="text-gray-900 font-medium break-all">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Delivery Address</h2>
            </div>
            <div className="p-4 text-sm">
              {snap ? (
                <address className="not-italic text-gray-700 leading-relaxed">
                  <div className="font-semibold text-gray-900 mb-1">{snap.name}</div>
                  <div>{snap.line1}</div>
                  {snap.line2 && <div>{snap.line2}</div>}
                  <div>{snap.city}, {snap.state} {snap.pincode}</div>
                  <div>{snap.country}</div>
                  <div className="mt-2 text-gray-500">📞 {snap.phone}</div>
                </address>
              ) : (
                <p className="text-gray-500">No delivery address captured.</p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Payment</h2>
            </div>
            <div className="p-4 text-sm space-y-3">
              {payment ? (
                <>
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Status</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Amount</div>
                    <div className="font-medium">{paise(payment.amount)} {payment.currency}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Razorpay Order ID</div>
                    <div className="font-mono text-xs text-gray-600 break-all">{payment.razorpayOrderId || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Razorpay Payment ID</div>
                    <div className="font-mono text-xs text-gray-600 break-all">{payment.razorpayPaymentId || 'N/A'}</div>
                  </div>
                  {payment.createdAt && (
                    <div>
                      <div className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Payment Time</div>
                      <div className="text-gray-700">
                        {new Date(payment.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">No payment record found.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
