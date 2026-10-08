'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, LogOut, ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react'
import { getCustomerFacingOrderStatus } from '@/lib/orders'

const TIMELINE_STEPS = [
  'PAYMENT_PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'IN_TRANSIT',
  'DELIVERED'
]

function getTimelineIndex(status: string) {
  const idx = TIMELINE_STEPS.indexOf(status)
  // If it's cancelled or refunded, we might not want to show the standard timeline, or just stop at the first few.
  return idx
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/account/orders')
      if (res.status === 401 || res.status === 403) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    const { notifyCartUpdated } = await import('@/lib/guest-cart')
    notifyCartUpdated()
    router.push('/')
    router.refresh()
  }

  function orderStatusClass(status: string): string {
    if (status === 'PAID')            return 'bg-green-100 text-green-800'
    if (status === 'PAYMENT_PENDING') return 'bg-yellow-100 text-yellow-800'
    if (status === 'CANCELLED')       return 'bg-red-100 text-red-800'
    if (status === 'PROCESSING')      return 'bg-blue-100 text-blue-800'
    if (status === 'SHIPPED')         return 'bg-indigo-100 text-indigo-800'
    if (status === 'IN_TRANSIT')      return 'bg-purple-100 text-purple-800'
    if (status === 'DELIVERED')       return 'bg-green-100 text-green-800'
    if (status === 'REFUND_INITIATED')return 'bg-orange-100 text-orange-800'
    if (status === 'REFUNDED')        return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-600'
  }

  if (loading) return <div className="min-h-screen p-8 text-center">Loading orders...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
          <Package className="w-8 h-8 text-brand-orange" />
          My Orders
        </h1>
        <button onClick={handleLogout} className="text-brand-charcoal/60 hover:text-red-500 flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-brand-linen shadow-sm">
          <Package className="w-12 h-12 text-brand-charcoal/20 mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">No orders yet</h2>
          <p className="text-brand-charcoal/60 mb-6">When you place orders, they will appear here.</p>
          <Link href="/shop" className="bg-brand-charcoal text-white px-4 md:px-6 py-3 rounded-xl">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const isExpanded = expandedOrderId === order.id
            const currentIdx = getTimelineIndex(order.status)
            const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUND_INITIATED' || order.status === 'REFUNDED'
            
            // Map history events for timeline
            const historyMap = new Map<string, string>() // status -> date string
            if (order.statusHistory) {
              order.statusHistory.forEach((h: any) => {
                // Keep the earliest date for each status
                if (!historyMap.has(h.status)) {
                  historyMap.set(h.status, new Date(h.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))
                }
              })
            }
            // Fallback for Order Placed
            if (!historyMap.has('PAYMENT_PENDING')) {
              historyMap.set('PAYMENT_PENDING', new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))
            }

            return (
            <div key={order.id} className="bg-white rounded-2xl border border-brand-linen shadow-sm overflow-hidden transition-all">
              <div 
                className="bg-brand-bg px-4 md:px-6 py-4 border-b border-brand-linen flex flex-wrap justify-between items-center gap-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
              >
                <div>
                  <p className="text-xs text-brand-charcoal/60 font-bold uppercase tracking-wider mb-1">Order #</p>
                  <p className="font-mono text-sm font-semibold">{order.id.split('-')[0]}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-charcoal/60 font-bold uppercase tracking-wider mb-1">Total</p>
                  <p className="font-medium">₹{(order.total / 100).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-charcoal/60 font-bold uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-bold rounded uppercase ${orderStatusClass(order.status)}`}>
                    {getCustomerFacingOrderStatus(order.status)}
                  </span>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="text-sm font-medium text-brand-orange">{isExpanded ? 'Hide Details' : 'View Details'}</span>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-brand-orange" /> : <ChevronDown className="w-5 h-5 text-brand-orange" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-6">
                  {/* Timeline Section */}
                  <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Order Timeline</h3>
                    <div className="space-y-6">
                      {isCancelled ? (
                        <div className="flex gap-4">
                           <div className="flex flex-col items-center">
                             <CheckCircle2 className="w-6 h-6 text-red-500 bg-white rounded-full" />
                           </div>
                           <div className="pt-0.5">
                             <p className="font-semibold text-red-600">{getCustomerFacingOrderStatus(order.status)}</p>
                             <p className="text-sm text-gray-500">
                               {historyMap.get(order.status) || new Date(order.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                             </p>
                           </div>
                        </div>
                      ) : (
                        TIMELINE_STEPS.map((step, idx) => {
                          const isCompleted = idx <= currentIdx
                          const isActive = idx === currentIdx
                          const isFuture = idx > currentIdx
                          const timestamp = historyMap.get(step)

                          return (
                            <div key={step} className="flex gap-4 relative">
                              {idx !== TIMELINE_STEPS.length - 1 && (
                                <div className={`absolute top-6 left-3 w-0.5 h-full -ml-px ${isCompleted && !isActive ? 'bg-brand-orange' : 'bg-gray-200'}`} />
                              )}
                              <div className="flex flex-col items-center relative z-10">
                                {isCompleted ? (
                                  <CheckCircle2 className={`w-6 h-6 bg-white rounded-full ${isActive ? 'text-brand-orange' : 'text-brand-orange'}`} />
                                ) : (
                                  <Circle className="w-6 h-6 text-gray-300 bg-white rounded-full" />
                                )}
                              </div>
                              <div className="pt-0.5 pb-2">
                                <p className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {getCustomerFacingOrderStatus(step as any)}
                                </p>
                                {isCompleted && timestamp && (
                                  <p className="text-sm text-gray-500 mt-0.5">{timestamp}</p>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* Items list */}
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-brand-charcoal/70">Items</h3>
                  <div className="space-y-4">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center border-b border-brand-linen/50 pb-4 last:border-0 last:pb-0">
                        <div>
                          <Link href={`/products/${item.productId}`} className="font-semibold hover:text-brand-orange block">
                            {item.productNameSnapshot}
                          </Link>
                          <p className="text-sm text-brand-charcoal/70 mt-1">Qty: {item.quantity}</p>
                        </div>
                        <div className="font-medium">₹{(item.subtotal / 100).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>

                  {/* Address */}
                  {order.addressSnapshot && (
                    <div className="mt-6 pt-6 border-t border-brand-linen">
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-brand-charcoal/70">Delivery Address</h3>
                      <p className="font-medium">{order.addressSnapshot.name}</p>
                      <p className="text-sm text-brand-charcoal/80 mt-1">{order.addressSnapshot.line1}</p>
                      {order.addressSnapshot.line2 && <p className="text-sm text-brand-charcoal/80">{order.addressSnapshot.line2}</p>}
                      <p className="text-sm text-brand-charcoal/80">{order.addressSnapshot.city}, {order.addressSnapshot.state} {order.addressSnapshot.pincode}</p>
                      <p className="text-sm text-brand-charcoal/80 mt-1">Phone: {order.addressSnapshot.phone}</p>
                    </div>
                  )}

                  {/* Shiprocket details if applicable */}
                  {order.shippingStatus && order.shippingStatus !== 'NOT_CREATED' && (
                    <div className="mt-6 pt-6 border-t border-brand-linen bg-blue-50/30 -mx-6 mb-[-1.5rem] p-6 rounded-b-2xl">
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-brand-charcoal/70 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Shipping Status
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Status</p>
                          <p className="font-semibold text-blue-700">{order.shippingStatus.replace(/_/g, ' ')}</p>
                        </div>
                        {order.courierName && (
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Courier</p>
                            <p className="font-medium text-gray-900">{order.courierName}</p>
                          </div>
                        )}
                        {order.awbCode && (
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Tracking Code (AWB)</p>
                            <p className="font-mono text-gray-900">{order.awbCode}</p>
                          </div>
                        )}
                      </div>
                      
                      {order.trackingUrl && (
                        <div className="mt-4">
                          <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors">
                            Track Shipment
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )})}
        </div>
      )}
    </div>
  )
}
