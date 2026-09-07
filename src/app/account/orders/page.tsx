'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, LogOut } from 'lucide-react'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
    router.push('/')
    router.refresh()
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
          <Link href="/shop" className="bg-brand-charcoal text-white px-6 py-3 rounded-xl">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-brand-linen shadow-sm overflow-hidden">
              <div className="bg-brand-bg px-6 py-4 border-b border-brand-linen flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-xs text-brand-charcoal/60 font-bold uppercase tracking-wider mb-1">Order Placed</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-charcoal/60 font-bold uppercase tracking-wider mb-1">Total</p>
                  <p className="font-medium">₹{(order.total / 100).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-charcoal/60 font-bold uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-bold rounded uppercase ${
                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-brand-charcoal/60 font-bold uppercase tracking-wider mb-1">Order #</p>
                  <p className="font-mono text-sm">{order.id.split('-')[0]}</p>
                </div>
              </div>
              <div className="p-6">
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
                {order.addressSnapshot && (
                  <div className="mt-6 pt-6 border-t border-brand-linen bg-gray-50 -m-6 p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-brand-charcoal/70">Delivery Address</h3>
                    <p className="font-medium">{order.addressSnapshot.name}</p>
                    <p className="text-sm text-brand-charcoal/80 mt-1">{order.addressSnapshot.line1}</p>
                    {order.addressSnapshot.line2 && <p className="text-sm text-brand-charcoal/80">{order.addressSnapshot.line2}</p>}
                    <p className="text-sm text-brand-charcoal/80">{order.addressSnapshot.city}, {order.addressSnapshot.state} {order.addressSnapshot.pincode}</p>
                    <p className="text-sm text-brand-charcoal/80 mt-1">Phone: {order.addressSnapshot.phone}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}