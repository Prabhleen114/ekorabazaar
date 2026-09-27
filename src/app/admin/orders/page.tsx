'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCustomerFacingOrderStatus } from '@/lib/orders'

type TabStatus = 'ALL' | 'PAYMENT_PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'REFUND_INITIATED' | 'REFUNDED'

const TABS: { key: TabStatus; label: string }[] = [
  { key: 'ALL',              label: 'Total' },
  { key: 'PAYMENT_PENDING',  label: 'Pending' },
  { key: 'PAID',             label: 'Confirmed' },
  { key: 'PROCESSING',       label: 'Processing' },
  { key: 'SHIPPED',          label: 'Shipped' },
  { key: 'IN_TRANSIT',       label: 'In Transit' },
  { key: 'DELIVERED',        label: 'Delivered' },
  { key: 'CANCELLED',        label: 'Cancelled' },
  { key: 'REFUND_INITIATED', label: 'Refund Initiated' },
  { key: 'REFUNDED',         label: 'Refunded' },
]

function orderStatusClass(status: string): string {
  if (status === 'PAID')            return 'bg-green-100 text-green-800'
  if (status === 'PAYMENT_PENDING') return 'bg-yellow-100 text-yellow-800'
  if (status === 'CANCELLED')       return 'bg-red-100 text-red-800'
  if (status === 'PROCESSING')      return 'bg-blue-100 text-blue-800'
  if (status === 'SHIPPED')         return 'bg-indigo-100 text-indigo-800'
  if (status === 'IN_TRANSIT')      return 'bg-purple-100 text-purple-800'
  if (status === 'DELIVERED')       return 'bg-green-100 text-green-800'
  if (status === 'REFUND_INITIATED')return 'bg-orange-100 text-orange-800'
  if (status === 'REFUNDED')        return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-600'
}

export default function AdminOrdersPage() {
  const [orders,     setOrders]     = useState<any[]>([])
  
  // Initialize counts for all tabs
  const defaultCounts = TABS.reduce((acc, tab) => {
    acc[tab.key] = 0
    return acc
  }, {} as Record<string, number>)
  
  const [counts,     setCounts]     = useState<Record<string, number>>(defaultCounts)
  const [loading,    setLoading]    = useState(true)
  const [errorMsg,   setErrorMsg]   = useState('')
  const [activeTab,  setActiveTab]  = useState<TabStatus>('ALL')
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch counts once on mount
  useEffect(() => { fetchCounts() }, [])

  // Refetch orders whenever tab changes
  useEffect(() => { setPage(1); fetchOrders(1, activeTab) }, [activeTab])

  async function fetchCounts() {
    try {
      const res  = await fetch('/api/admin/orders?page=1&limit=5000')
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setErrorMsg('Session expired or unauthorized. Please re-login.')
        }
        return
      }
      const data = await res.json()
      const all: any[] = data.orders || []
      
      const c = { ...defaultCounts }
      c.ALL = all.length
      
      all.forEach((o: any) => {
        if (c[o.status] !== undefined) {
          c[o.status]++
        }
      })
      setCounts(c)
    } catch (e) { console.error(e) }
  }

  async function fetchOrders(pageNum: number, tab: TabStatus) {
    setLoading(true)
    setErrorMsg('')
    try {
      const statusParam = tab !== 'ALL' ? ('&status=' + tab) : ''
      const res  = await fetch('/api/admin/orders?page=' + pageNum + '&limit=20' + statusParam)
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Admin session expired. Please log in again.')
        }
        throw new Error('Failed to fetch orders from server.')
      }
      const data = await res.json()
      setOrders(data.orders || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err: any) { 
      console.error(err)
      setErrorMsg(err.message || 'Error loading orders')
    }
    finally { setLoading(false) }
  }

  function handleRefresh() { fetchCounts(); fetchOrders(page, activeTab) }
  function goPage(p: number) { setPage(p); fetchOrders(p, activeTab) }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 w-full">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          const tabCls = isActive
            ? 'bg-gray-900 shadow-md text-white border-transparent'
            : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200'
          const badgeCls = isActive
            ? 'bg-white text-gray-900'
            : 'bg-gray-100 text-gray-600'
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={'px-3 py-2 rounded-lg text-sm font-medium transition-all border ' + tabCls}
            >
              {tab.label}
              <span className={'ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold ' + badgeCls}>
                {counts[tab.key]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                <th className="p-4">Order ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    {activeTab === 'ALL'
                      ? 'No orders found.'
                      : 'No orders found with status "' + activeTab + '".'}
                  </td>
                </tr>
              ) : orders.map((order) => {
                const snap        = order.addressSnapshot as Record<string, string> | null
                const displayName = snap?.name || order.customer?.email || 'N/A'
                const subEmail    = snap?.name ? (order.customer?.email || '') : ''
                const totalINR    = (order.total / 100).toFixed(2)
                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-gray-500">
                      <span title={order.id}>{order.id.substring(0, 8)}...</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-gray-900">{displayName}</div>
                      {subEmail && <div className="text-xs text-gray-500">{subEmail}</div>}
                    </td>
                    <td className="p-4 text-sm font-semibold text-gray-900">Rs. {totalINR}</td>
                    <td className="p-4">
                      <span className={'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ' + orderStatusClass(order.status)}>
                        {getCustomerFacingOrderStatus(order.status as any)}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link
                        href={'/admin/orders/' + order.id}
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
