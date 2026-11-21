'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SellerProfilePage() {
  const router = useRouter()
  const [seller, setSeller] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/seller/profile')
        if (res.status === 401 || res.status === 403) {
          router.push('/sell/start-selling')
          return
        }
        if (!res.ok) {
          throw new Error('Failed to load profile')
        }
        const data = await res.json()
        if (isMounted) {
          setSeller(data.seller)
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error loading profile')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchProfile()
    return () => {
      isMounted = false
    }
  }, [router])

  if (loading) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 animate-pulse mb-6">
          <div className="h-10 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 animate-pulse">
          <div className="h-10 bg-gray-100 rounded w-1/2" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (error || !seller) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
          {error || 'Unable to load profile.'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Business Profile</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">Brand Information</h2>
          <p className="text-sm text-gray-500 mt-1">This is how your brand appears to customers.</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Brand Name</label>
            <input type="text" readOnly className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-500 cursor-not-allowed" value={seller.brandName || ''} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">Legal Business Details</h2>
          <p className="text-sm text-gray-500 mt-1">Information submitted for verification. Contact support to change these details.</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Legal Name</label>
            <input type="text" readOnly className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-500 cursor-not-allowed" value={seller.businessDetails?.legalName || ''} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Type</label>
            <input type="text" readOnly className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-500 cursor-not-allowed" value={seller.businessDetails?.businessType || ''} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Registered Address</label>
            <textarea readOnly className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-500 cursor-not-allowed" rows={3} value={seller.businessDetails?.address || ''} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">GSTIN</label>
            <input type="text" readOnly className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-500 cursor-not-allowed" value={seller.businessDetails?.gstin || 'Not Provided'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">GST Verification Status</label>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {seller.businessDetails?.gstStatus || 'NOT_SUBMITTED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
