'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'

export default function CartPage() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart')
      if (res.status === 401 || res.status === 403) {
        router.push('/login?redirect=/cart')
        return
      }
      const data = await res.json()
      setItems(data.items || [])
      setTotal(data.totalAmount || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return
    try {
      await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      })
      fetchCart()
    } catch (err) {
      console.error(err)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      await fetch(`/api/cart/${itemId}`, { method: 'DELETE' })
      fetchCart()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="min-h-screen p-8 text-center">Loading cart...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold font-serif mb-8 flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-brand-orange" />
        Your Cart
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-brand-linen shadow-sm">
          <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-brand-charcoal/30" />
          </div>
          <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
          <p className="text-brand-charcoal/60 mb-6">Looks like you haven't added anything yet.</p>
          <Link href="/shop" className="bg-brand-charcoal text-white px-6 py-3 rounded-xl hover:bg-brand-charcoal/90 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-brand-linen shadow-sm flex gap-4 items-center">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-brand-bg relative flex-shrink-0">
                  {item.product.imageUrl ? (
                    <Image src={item.product.imageUrl} alt={item.product.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-1">
                  <Link href={`/products/${item.productId}`} className="font-semibold hover:text-brand-orange transition-colors">
                    {item.product.title}
                  </Link>
                  <div className="text-brand-orange font-bold mt-1">₹{(item.effectivePrice / 100).toLocaleString()}</div>
                  {!item.isAvailable && <p className="text-red-500 text-xs font-semibold mt-1">Currently unavailable</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center bg-brand-bg rounded-lg border border-brand-linen">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 hover:bg-brand-linen/50 rounded-l-lg" disabled={!item.isAvailable}>
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:bg-brand-linen/50 rounded-r-lg" disabled={!item.isAvailable}>
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-brand-linen shadow-sm h-fit sticky top-24">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            <div className="flex justify-between mb-4 text-lg">
              <span className="text-brand-charcoal/70">Subtotal</span>
              <span className="font-bold">₹{(total / 100).toLocaleString()}</span>
            </div>
            <Link 
              href="/checkout"
              className="w-full block text-center bg-brand-orange hover:bg-brand-terracotta text-white py-3.5 rounded-xl font-semibold transition-all shadow-md mt-6"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}