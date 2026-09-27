'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminLeadsPage() {
  const [leads,      setLeads]      = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [errorMsg,   setErrorMsg]   = useState('')
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Fetch leads on mount and page change
  useEffect(() => { fetchLeads(page) }, [page])

  async function fetchLeads(pageNum: number) {
    setLoading(true)
    setErrorMsg('')
    try {
      const res  = await fetch('/api/admin/leads?page=' + pageNum + '&limit=20')
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Admin session expired. Please log in again.')
        }
        throw new Error('Failed to fetch leads from server.')
      }
      const data = await res.json()
      setLeads(data.leads || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalCount(data.pagination?.total || 0)
    } catch (err: any) { 
      console.error(err)
      setErrorMsg(err.message || 'Error loading leads')
    }
    finally { setLoading(false) }
  }

  function handleRefresh() { fetchLeads(page) }
  function goPage(p: number) { setPage(p) }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Checkout Leads</h1>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">
            {totalCount} Pending
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-black transition-colors"
        >
          Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button 
            onClick={handleRefresh}
            className="underline font-bold hover:text-red-950 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                <th className="p-4">Checkout ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Loading leads...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No checkout leads found.
                  </td>
                </tr>
              ) : leads.map((lead) => {
                const snap        = lead.addressSnapshot as Record<string, string> | null
                const displayName = snap?.name || lead.customer?.email || 'N/A'
                const subEmail    = snap?.name ? (lead.customer?.email || '') : ''
                const totalINR    = (lead.total / 100).toFixed(2)
                const pgStatus    = lead.payments?.[0]?.status || 'PENDING'
                
                return (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-gray-500">
                      <span title={lead.id}>{lead.id.substring(0, 8)}...</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-gray-900">{displayName}</div>
                      {subEmail && <div className="text-xs text-gray-500">{subEmail}</div>}
                    </td>
                    <td className="p-4 text-sm font-semibold text-gray-900">Rs. {totalINR}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        {pgStatus === 'FAILED' ? 'Payment Failed' : 'Payment Pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link
                        href={'/admin/leads/' + lead.id}
                        className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button
            disabled={page === 1}
            onClick={() => goPage(page - 1)}
            className="px-4 py-2 border border-gray-200 rounded disabled:opacity-50 text-sm font-medium"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => goPage(page + 1)}
            className="px-4 py-2 border border-gray-200 rounded disabled:opacity-50 text-sm font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
