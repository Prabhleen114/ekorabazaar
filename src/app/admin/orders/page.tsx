'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchOrders(page)
  }, [page])

  const fetchOrders = async (pageNumber: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders?page=${pageNumber}&limit=20`)
      if (!res.ok) throw new Error("Failed to fetch orders")
      const data = await res.json()
      setOrders(data.orders || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button onClick={() => fetchOrders(page)} className="px-4 py-2 bg-brand-charcoal text-white rounded hover:bg-black transition-colors text-sm">
          Refresh List
        </button>
      </div>

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
                  <td colSpan={6} className="p-8 text-center text-gray-500">No orders found.</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const customerName = order.customer?.name || 'Guest'
                  const customerEmail = order.customer?.email || 'N/A'
                  const totalINR = (order.total / 100).toFixed(2)
                  const isPaid = order.status === 'PAID'

                  return (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono text-xs text-gray-600 truncate max-w-[150px]">
                        {order.id}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900">{customerName}</div>
                        <div className="text-xs text-gray-500">{customerEmail}</div>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-900">
                        ₹{totalINR}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link 
                          href={`/admin/orders/${order.id}`}
                          className="text-sm text-brand-orange hover:text-orange-700 font-medium"
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

      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border border-gray-200 rounded disabled:opacity-50 text-sm font-medium"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-gray-200 rounded disabled:opacity-50 text-sm font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
