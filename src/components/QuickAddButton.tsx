'use client'

import { useState } from 'react'

export default function QuickAddButton({ productId, productName, basePrice, category }: { productId: string, productName?: string, basePrice?: number, category?: string }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading || success) return

    setLoading(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      })

      if (res.status === 401 || res.status === 403) {
        const { addGuestCartItem } = await import('@/lib/guest-cart')
        addGuestCartItem({
          productId,
          quantity: 1,
          title: productName,
          basePrice
        })
        const { notifyCartUpdated } = await import('@/lib/guest-cart')
        notifyCartUpdated()
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
        return
      }

      if (!res.ok) throw new Error('Failed to add to cart')

      const { notifyCartUpdated } = await import('@/lib/guest-cart')
      notifyCartUpdated()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      className={`mt-2 w-full text-[10px] uppercase tracking-widest py-2.5 transition-all md:opacity-0 md:group-hover:opacity-100 ${
        success ? 'bg-emerald-600 text-white' : 'bg-stone-900 text-white hover:bg-stone-800'
      }`}
    >
      {loading ? 'Adding...' : success ? 'Added ✓' : 'Add to Cart'}
    </button>
  )
}
