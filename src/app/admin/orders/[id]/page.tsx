'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminOrderDetailsPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}`)
      if (!res.ok) throw new Error("Failed to fetch order details")
      const data = await res.json()
      setOrder(data.order)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading order details...</div>
  }

  if (!order) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded mb-4">Order not found.</div>
        <button onClick={() => router.push('/admin/orders')} className="text-brand-orange hover:underline text-sm font-medium">
          &larr; Back to Orders
        </button>
      </div>
    )
  }

  const customerName = order.customer?.name || order.addressSnapshot?.name || 'Guest'
  const customerEmail = order.customer?.email || 'N/A'
  const customerPhone = order.customer?.phone || order.addressSnapshot?.phone || 'N/A'
  const payment = order.payments && order.payments.length > 0 ? order.payments[0] : null
  const totalINR = (order.total / 100).toFixed(2)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.push('/admin/orders')} className="text-brand-orange hover:underline text-sm font-medium flex items-center mb-4">
          &larr; Back to Orders
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
            <p className="text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${order.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Items Ordered</h2>
            </div>
            <div className="p-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Product</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Qty</th>
                    <th className="p-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="p-4">
                        <div className="font-medium text-sm text-gray-900">{item.productName || item.productId}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">₹{(item.price / 100).toFixed(2)}</td>
                      <td className="p-4 text-sm text-gray-600">{item.quantity}</td>
                      <td className="p-4 text-sm font-medium text-gray-900 text-right">
                        ₹{((item.price * item.quantity) / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900 font-medium">₹{(order.subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-500">Shipping</span>
                <span className="text-gray-900 font-medium">₹{(order.shipping / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900 font-medium">₹{(order.tax / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">₹{totalINR}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Customer Details</h2>
            </div>
            <div className="p-4 text-sm space-y-3">
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Name</div>
                <div className="font-medium text-gray-900">{customerName}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Email</div>
                <div className="text-gray-900">{customerEmail}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Phone</div>
                <div className="text-gray-900">{customerPhone}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Delivery Address</h2>
            </div>
            <div className="p-4 text-sm">
              {order.addressSnapshot ? (
                <address className="not-italic text-gray-700 space-y-1">
                  <div className="font-medium text-gray-900 mb-2">{order.addressSnapshot.name}</div>
                  <div>{order.addressSnapshot.line1}</div>
                  {order.addressSnapshot.line2 && <div>{order.addressSnapshot.line2}</div>}
                  <div>{order.addressSnapshot.city}, {order.addressSnapshot.state} {order.addressSnapshot.pincode}</div>
                  <div>{order.addressSnapshot.country}</div>
                  <div className="mt-2 text-gray-500">Phone: {order.addressSnapshot.phone}</div>
                </address>
              ) : (
                <div className="text-gray-500">No delivery address provided.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Payment Details</h2>
            </div>
            <div className="p-4 text-sm space-y-3">
              {payment ? (
                <>
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Payment Status</div>
                    <div className="font-medium text-gray-900">{payment.status}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Razorpay Order ID</div>
                    <div className="font-mono text-xs text-gray-600 break-all">{payment.razorpayOrderId || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Razorpay Payment ID</div>
                    <div className="font-mono text-xs text-gray-600 break-all">{payment.razorpayPaymentId || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Currency</div>
                    <div className="text-gray-900">{payment.currency}</div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500">No payment records found.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
