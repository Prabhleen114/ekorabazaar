'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddToCartButton({ productId, inStock }: { productId: string, inStock: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleAddToCart = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      })

      if (res.status === 401 || res.status === 403) {
        // Redirect to login if unauthenticated or forbidden (seller)
        router.push(`/login?redirect=/products/${productId}`)
        return
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add to cart')
      }

      // Success
      router.push('/cart')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <button
        onClick={handleAddToCart}
        disabled={loading || !inStock}
        className="w-full bg-brand-charcoal text-white py-3 px-6 rounded-xl font-medium hover:bg-brand-charcoal/90 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
      </button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
