'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SellerProductManager from './SellerProductManager'

export default function SellerProductsPage() {
  const router = useRouter()
  const [data, setData] = useState<{ locked: boolean; accountStatus?: string; products: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/seller/products')
        if (res.status === 401 || res.status === 403) {
          router.push('/sell/start-selling')
          return
        }
        if (!res.ok) {
          throw new Error('Failed to load products')
        }
        const json = await res.json()
        if (isMounted) {
          setData(json)
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error loading products')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchProducts()
    return () => {
      isMounted = false
    }
  }, [router])

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 p-5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
          {error || 'Unable to load products.'}
        </div>
      </div>
    )
  }

  if (data.locked) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Commerce features locked</h3>
          <p className="mt-2 text-sm text-red-700">Your account must be ACTIVE to manage products. Current status: {data.accountStatus}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <SellerProductManager initialProducts={data.products || []} />
    </div>
  )
}
