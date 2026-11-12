'use client'

import { useState } from 'react'

export default function QuickAddButton({ productId, productName, basePrice, category, inStock = true }: { productId: string, productName?: string, basePrice?: number, category?: string, inStock?: boolean }) {
  const isZeroPrice = basePrice !== undefined && (isNaN(basePrice) || basePrice <= 0);
  if (!inStock || isZeroPrice) {
    return (
      <button
        disabled={true}
        type="button"
        className="mt-2 w-full text-[10px] uppercase tracking-widest py-2.5 bg-stone-100 border border-stone-200 text-stone-500 cursor-not-allowed font-semibold md:opacity-0 md:group-hover:opacity-100 transition-all select-none"
      >
        {isZeroPrice ? "Quote on Request" : "Out of Stock"}
      </button>
    );
  }
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading || success || isZeroPrice) return

    setLoading(true)
    setErrorMsg('')
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add to cart')
      }

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
        success ? 'bg-emerald-600 text-white' : errorMsg ? 'bg-red-600 text-white' : 'bg-stone-900 text-white hover:bg-stone-800'
      }`}
    >
      {loading ? 'Adding...' : success ? 'Added ✓' : errorMsg ? errorMsg : 'Add to Cart'}
    </button>
  )
}
