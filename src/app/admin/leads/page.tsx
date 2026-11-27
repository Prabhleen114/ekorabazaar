'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Users, RefreshCw } from 'lucide-react'

type SourceTab = 'ALL' | 'CANCELLED_ORDER' | 'INCOMPLETE_CHECKOUT' | 'ABANDONED_CHECKOUT'
type StatusFilter = 'ALL' | 'NEW' | 'CONTACTED' | 'CONVERTED' | 'LOST'

const SOURCE_TABS: { key: SourceTab; label: string }[] = [
  { key: 'ALL', label: 'All Leads' },
  { key: 'CANCELLED_ORDER', label: 'Cancelled Orders' },
  { key: 'INCOMPLETE_CHECKOUT', label: 'Incomplete Checkouts' },
  { key: 'ABANDONED_CHECKOUT', label: 'Abandoned Checkouts' },
]

function sourceBadgeClass(source: string): string {
  if (source === 'CANCELLED_ORDER') return 'bg-red-100 text-red-800 border-red-200'
  if (source === 'INCOMPLETE_CHECKOUT') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  if (source === 'ABANDONED_CHECKOUT') return 'bg-purple-100 text-purple-800 border-purple-200'
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

function sourceLabel(source: string): string {
  if (source === 'CANCELLED_ORDER') return 'Cancelled Order'
  if (source === 'INCOMPLETE_CHECKOUT') return 'Incomplete Checkout'
  if (source === 'ABANDONED_CHECKOUT') return 'Abandoned Checkout'
  return source
}

function statusBadgeClass(status: string): string {
  if (status === 'CONVERTED') return 'bg-emerald-100 text-emerald-800'
  if (status === 'CONTACTED') return 'bg-blue-100 text-blue-800'
  if (status === 'LOST') return 'bg-gray-100 text-gray-600'
  return 'bg-amber-100 text-amber-800'
}

interface LeadSnapshotItem {
  productId?: string
  productName?: string
  quantity?: number
}

interface AdminLeadRow {
  id: string
  source: string
  status: string
  orderId?: string | null
  convertedOrderId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  itemsSnapshot?: LeadSnapshotItem[] | null
  orderValue?: number
  lastActivityAt?: string
  createdAt: string
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdminLeadRow[]>([])
  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({
    ALL: 0,
    CANCELLED_ORDER: 0,
    INCOMPLETE_CHECKOUT: 0,
    ABANDONED_CHECKOUT: 0,
  })
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [sourceTab, setSourceTab] = useState<SourceTab>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchLeads = useCallback(async (pageNum: number, src: SourceTab, st: StatusFilter, q: string) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: '20',
      })
      if (src !== 'ALL') params.set('source', src)
      if (st !== 'ALL') params.set('status', st)
      if (q.trim()) params.set('q', q.trim())

      const res = await fetch('/api/admin/leads?' + params.toString(), { cache: 'no-store' })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Admin session expired. Please log in again.')
        }
        throw new Error('Failed to fetch leads from server.')
      }
      const data = await res.json()
      setLeads(data.leads || [])
      if (data.counts?.bySource) setSourceCounts(data.counts.bySource)
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalCount(data.pagination?.total || 0)
    } catch (err: unknown) {
      console.error(err)
      setErrorMsg(err instanceof Error ? err.message : 'Error loading leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLeads(page, sourceTab, statusFilter, searchQuery)
    }, 0)
    return () => clearTimeout(timer)
  }, [page, sourceTab, statusFilter, searchQuery, fetchLeads])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearchQuery(searchInput)
  }

  function handleRefresh() {
    fetchLeads(page, sourceTab, statusFilter, searchQuery)
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Cancelled orders, incomplete checkouts, and abandoned checkout attempts
            </p>
          </div>
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {totalCount} Matching
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-black transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={handleRefresh} className="underline font-bold hover:text-red-950 ml-4">
            Retry
          </button>
        </div>
      )}

      {/* Source Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SOURCE_TABS.map((tab) => {
          const isActive = sourceTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => {
                setSourceTab(tab.key)
                setPage(1)
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                isActive
                  ? 'bg-gray-900 text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200'
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {sourceCounts[tab.key] ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* Status Filter + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'NEW', 'CONTACTED', 'CONVERTED', 'LOST'] as StatusFilter[]).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st)
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                statusFilter === st
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, phone, order ID..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-gray-100 text-gray-800 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-200"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="p-4">Lead Type</th>
                <th className="p-4">Activity Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Products</th>
                <th className="p-4">Order Value</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No leads found matching current filters.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const items = Array.isArray(lead.itemsSnapshot) ? lead.itemsSnapshot : []
                  const totalUnits = items.reduce((s: number, i: LeadSnapshotItem) => s + (Number(i.quantity) || 0), 0)
                  const valueINR = ((Number(lead.orderValue) || 0) / 100).toFixed(2)
                  const displayName = lead.customerName || lead.customerEmail || 'Guest Customer'

                  return (
                    <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${sourceBadgeClass(
                            lead.source
                          )}`}
                        >
                          {sourceLabel(lead.source)}
                        </span>
                        {lead.orderId && (
                          <div className="text-[11px] font-mono text-gray-400 mt-1" title={lead.orderId}>
                            Order #{lead.orderId.substring(0, 8)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(lead.lastActivityAt || lead.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900">{displayName}</div>
                        {lead.customerEmail && (
                          <div className="text-xs text-gray-500">{lead.customerEmail}</div>
                        )}
                        {lead.customerPhone && (
                          <div className="text-xs text-gray-500 font-mono">{lead.customerPhone}</div>
                        )}
                      </td>
                      <td className="p-4 text-xs text-gray-600 max-w-xs">
                        {items.length > 0 ? (
                          <>
                            <div className="font-medium text-gray-800 truncate">
                              {items[0].productName}
                              {items.length > 1 ? ` +${items.length - 1} more` : ''}
                            </div>
                            <div className="text-gray-400 mt-0.5">
                              {items.length} line{items.length === 1 ? '' : 's'} &bull; {totalUnits} unit
                              {totalUnits === 1 ? '' : 's'}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400">No items captured</span>
                        )}
                      </td>
                      <td className="p-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        Rs. {valueINR}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${statusBadgeClass(
                            lead.status
                          )}`}
                        >
                          {lead.status}
                        </span>
                        {lead.convertedOrderId && (
                          <div className="mt-1">
                            <Link
                              href={`/admin/orders/${lead.convertedOrderId}`}
                              className="text-[11px] text-emerald-700 underline font-medium"
                            >
                              Order #{lead.convertedOrderId.substring(0, 8)}
                            </Link>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Link
                          href={'/admin/leads/' + lead.id}
                          className="text-sm text-orange-600 hover:text-orange-800 font-medium whitespace-nowrap"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white disabled:opacity-50 text-sm font-medium"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white disabled:opacity-50 text-sm font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
