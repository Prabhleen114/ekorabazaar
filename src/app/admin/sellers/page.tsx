'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSellerActions from './AdminSellerActions'

export default function AdminSellersPage() {
  const router = useRouter()
  const [sellers, setSellers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    const fetchSellers = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/sellers')
        if (res.status === 401) {
          router.push('/')
          return
        }
        if (!res.ok) {
          throw new Error('Failed to load sellers')
        }
        const data = await res.json()
        if (isMounted) {
          setSellers(data.sellers || [])
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error loading sellers')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchSellers()
    return () => {
      isMounted = false
    }
  }, [router])

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Seller Management</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller Details</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Info</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined / Stats</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statuses</th>
              <th className="relative px-4 md:px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sellers.map((seller) => (
              <tr key={seller.id}>
                <td className="px-4 md:px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">{seller.brandName}</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">ID: {seller.id}</div>
                  <div className="text-sm text-gray-500 mt-1">{seller.businessDetails?.legalName || 'No Legal Name'}</div>
                  <div className="text-xs text-gray-400 mt-1">GSTIN: {seller.businessDetails?.gstin || 'N/A'} • {seller.businessDetails?.gstStatus || 'N/A'}</div>
                  {seller.businessDetails?.tradeName && (
                    <div className="text-xs text-gray-400 mt-1">Trade: {seller.businessDetails.tradeName}</div>
                  )}
                  {seller.businessDetails?.city && (
                    <div className="text-xs text-gray-400 mt-1">Location: {seller.businessDetails.city}, {seller.businessDetails.state}</div>
                  )}
                </td>
                <td className="px-4 md:px-6 py-4">
                  <div className="text-sm text-gray-900">{seller.user?.email || 'N/A'}</div>
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                   <div className="text-sm text-gray-900">{new Date(seller.createdAt).toLocaleDateString()}</div>
                   <div className="text-sm text-gray-500 mt-1">{seller._count?.products ?? 0} Products Listed</div>
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                   <div className="mb-2">
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      App: {seller.applicationStatus}
                     </span>
                   </div>
                   <div>
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      seller.accountStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      seller.accountStatus === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                     }`}>
                      Acc: {seller.accountStatus}
                     </span>
                   </div>
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <AdminSellerActions seller={seller} />
                </td>
              </tr>
            ))}

            {sellers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 md:px-6 py-12 text-center text-sm text-gray-500">
                  No sellers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
