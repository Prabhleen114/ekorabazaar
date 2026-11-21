'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminProductActions from './AdminProductActions'
import { normalizeProductBasePriceToINR } from '@/lib/pricing'

function AdminProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sellerId = searchParams.get('sellerId') || undefined

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const url = sellerId
          ? `/api/admin/products?sellerId=${encodeURIComponent(sellerId)}`
          : '/api/admin/products'
        const res = await fetch(url)
        if (res.status === 401) {
          router.push('/')
          return
        }
        if (!res.ok) {
          throw new Error('Failed to load products')
        }
        const data = await res.json()
        if (isMounted) {
          setProducts(data.products || [])
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
  }, [sellerId, router])

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller Details</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="relative px-4 md:px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 md:px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={product.title}>{product.title}</div>
                  <div className="text-xs text-gray-500 mt-1">ID: {product.id}</div>
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.seller?.brandName || 'Unknown'}</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">{product.sellerId || 'N/A'}</div>
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    Seller Price: {product.price > 0 ? `₹${normalizeProductBasePriceToINR({ ...product, customerPrice: null }).toFixed(2)}` : "None / Zero"}
                  </div>
                  <div className="text-sm font-bold text-gray-900 mt-1">
                    Cust Price: {product.customerPrice && product.customerPrice > 0 ? `₹${normalizeProductBasePriceToINR(product).toFixed(2)}` : 'N/A'}
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                    product.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                    product.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {product.status === 'PENDING_APPROVAL' && (
                    <AdminProductActions product={product} />
                  )}
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 md:px-6 py-12 text-center text-sm text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <AdminProductsContent />
    </Suspense>
  )
}
