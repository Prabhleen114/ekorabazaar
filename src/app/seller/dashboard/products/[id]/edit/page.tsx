'use client'

export const dynamic = 'force-static'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import SellerProductForm from '@/components/SellerProductForm'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let isMounted = true

    const fetchProduct = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/seller/products/${id}`)
        if (res.status === 401 || res.status === 403) {
          router.push('/sell/start-selling')
          return
        }
        if (res.status === 404) {
          if (isMounted) setError('Product not found')
          return
        }
        if (!res.ok) {
          throw new Error('Failed to load product')
        }
        const data = await res.json()
        if (isMounted) {
          setProduct(data.product)
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error loading product')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchProduct()
    return () => {
      isMounted = false
    }
  }, [id, router])

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-96 bg-gray-100 rounded animate-pulse mb-8" />
        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 animate-pulse">
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-24 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
          {error || 'Product not found.'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold font-serif text-brand-charcoal">Manage Product</h1>
        <p className="text-brand-charcoal/60 mt-2">Update your wholesale product listing details.</p>
      </div>
      <SellerProductForm initialData={product} />
    </div>
  )
}
