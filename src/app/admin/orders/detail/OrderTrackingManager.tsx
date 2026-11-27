'use client'

import { useState } from 'react'
import { Truck, Plus, Edit2, Trash2, ExternalLink, Copy, Check, X, PackageCheck } from 'lucide-react'

export interface OrderShipmentItem {
  id: string
  shipmentNumber: number
  courierName: string
  awbCode: string
  trackingUrl?: string | null
  status: string
  shippedAt?: string | null
  deliveredAt?: string | null
  createdAt: string
  updatedAt: string
}

const SHIPMENT_STATUSES = [
  { value: 'CREATED', label: 'Created' },
  { value: 'AWB_ASSIGNED', label: 'AWB Assigned' },
  { value: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'EXCEPTION', label: 'Exception' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const COURIER_PRESETS = ['Delhivery', 'Blue Dart', 'DTDC', 'Xpressbees', 'Ecom Express', 'Shadowfax', 'India Post']

function shipmentStatusClass(status: string): string {
  switch (status) {
    case 'DELIVERED':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'IN_TRANSIT':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'SHIPPED':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'AWB_ASSIGNED':
    case 'PICKUP_SCHEDULED':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'EXCEPTION':
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export default function OrderTrackingManager({
  orderId,
  orderStatus,
  initialShipments = [],
  onUpdated,
}: {
  orderId: string
  orderStatus: string
  initialShipments: OrderShipmentItem[]
  onUpdated?: () => void
}) {
  const [shipments, setShipments] = useState<OrderShipmentItem[]>(initialShipments)
  const [showAddForm, setShowAddForm] = useState(initialShipments.length === 0)
  const [courierName, setCourierName] = useState('')
  const [awbCode, setAwbCode] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [status, setStatus] = useState('SHIPPED')
  const [updateOrderStatus, setUpdateOrderStatus] = useState(
    orderStatus === 'PAID' || orderStatus === 'PROCESSING'
  )

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCourier, setEditCourier] = useState('')
  const [editAwb, setEditAwb] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editStatus, setEditStatus] = useState('SHIPPED')

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleCopyAwb = async (id: string, awb: string) => {
    try {
      await navigator.clipboard.writeText(awb)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {}
  }

  const handleAddShipment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierName: courierName.trim(),
          awbCode: awbCode.trim(),
          trackingUrl: trackingUrl.trim() || null,
          status,
          updateOrderStatus,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add shipment')
      }
      setShipments((prev) => [...prev, data.shipment])
      setCourierName('')
      setAwbCode('')
      setTrackingUrl('')
      setStatus('SHIPPED')
      setShowAddForm(false)
      setSuccessMsg(`Shipment #${data.shipment.shipmentNumber} added (${data.shipment.courierName}).`)
      if (onUpdated) onUpdated()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add shipment')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (s: OrderShipmentItem) => {
    setEditingId(s.id)
    setEditCourier(s.courierName)
    setEditAwb(s.awbCode)
    setEditUrl(s.trackingUrl || '')
    setEditStatus(s.status)
    setErrorMsg('')
    setSuccessMsg('')
  }

  const handleSaveEdit = async (shipmentId: string) => {
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierName: editCourier.trim(),
          awbCode: editAwb.trim(),
          trackingUrl: editUrl.trim() || null,
          status: editStatus,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update shipment')
      }
      setShipments((prev) => prev.map((item) => (item.id === shipmentId ? data.shipment : item)))
      setEditingId(null)
      setSuccessMsg(`Shipment #${data.shipment.shipmentNumber} updated.`)
      if (onUpdated) onUpdated()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update shipment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteShipment = async (shipmentId: string) => {
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipments/${shipmentId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove shipment')
      }
      setShipments((prev) => prev.filter((item) => item.id !== shipmentId))
      setConfirmDeleteId(null)
      setSuccessMsg('Shipment removed.')
      if (onUpdated) onUpdated()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to remove shipment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-orange-600" />
          <h2 className="font-semibold text-gray-900">Shipment Tracking Management</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
            {shipments.length} {shipments.length === 1 ? 'Shipment' : 'Shipments'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddForm((v) => !v)
            setErrorMsg('')
            setSuccessMsg('')
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-black transition-colors"
        >
          {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showAddForm ? 'Close Form' : 'Add Shipment'}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            {successMsg}
          </div>
        )}

        {/* Existing Shipments List */}
        {shipments.length === 0 ? (
          <div className="text-sm text-gray-500 py-3 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No shipment tracking added yet. Add one or multiple shipments below.
          </div>
        ) : (
          <div className="space-y-3">
            {shipments.map((s, idx) => {
              const isEditing = editingId === s.id
              const isConfirmDelete = confirmDeleteId === s.id

              return (
                <div
                  key={s.id}
                  className="rounded-lg border border-gray-200 bg-gray-50/70 p-4 transition-colors"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                          Editing Shipment #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-xs text-gray-500 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Courier Partner *</label>
                          <input
                            type="text"
                            value={editCourier}
                            onChange={(e) => setEditCourier(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">AWB / Tracking Number *</label>
                          <input
                            type="text"
                            value={editAwb}
                            onChange={(e) => setEditAwb(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Tracking URL</label>
                          <input
                            type="url"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Shipment Status</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white"
                          >
                            {SHIPMENT_STATUSES.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          disabled={submitting}
                          className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(s.id)}
                          disabled={submitting || !editCourier.trim() || !editAwb.trim()}
                          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                        >
                          {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-800">
                            <PackageCheck className="w-3.5 h-3.5 text-orange-600" />
                            Shipment {idx + 1}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">{s.courierName}</span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${shipmentStatusClass(
                              s.status
                            )}`}
                          >
                            {s.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                          <span className="flex items-center gap-1.5">
                            AWB: <strong className="font-mono text-gray-900">{s.awbCode}</strong>
                            <button
                              type="button"
                              onClick={() => handleCopyAwb(s.id, s.awbCode)}
                              className="text-gray-400 hover:text-gray-700"
                              title="Copy AWB"
                            >
                              {copiedId === s.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </span>
                          {s.trackingUrl && (
                            <a
                              href={s.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 font-medium underline"
                            >
                              Tracking Link
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Added {new Date(s.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isConfirmDelete ? (
                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                            <span className="text-xs text-red-800 font-medium">Remove?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteShipment(s.id)}
                              disabled={submitting}
                              className="text-xs font-bold text-red-700 hover:text-red-900 px-1.5"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-gray-600 hover:text-gray-900 px-1"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-100"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(s.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add New Shipment Form */}
        {showAddForm && (
          <form onSubmit={handleAddShipment} className="p-4 rounded-lg border border-orange-200 bg-orange-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Add Shipment #{shipments.length + 1}
              </h3>
              <div className="flex flex-wrap gap-1">
                {COURIER_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCourierName(preset)}
                    className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                      courierName === preset
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Courier Partner Name *
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Delhivery, Blue Dart"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  AWB / Tracking Number *
                </label>
                <input
                  type="text"
                  value={awbCode}
                  onChange={(e) => setAwbCode(e.target.value)}
                  placeholder="e.g. 1234567890"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tracking URL
                </label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://www.delhivery.com/track/package/..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Shipment Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {SHIPMENT_STATUSES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(orderStatus === 'PAID' || orderStatus === 'PROCESSING') && (
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateOrderStatus}
                  onChange={(e) => setUpdateOrderStatus(e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span>Also mark overall order status as Shipped</span>
              </label>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting || !courierName.trim() || !awbCode.trim()}
                className="px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Adding Shipment...' : 'Save Shipment Tracking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
