'use client'

import { useState } from 'react'
import { Truck, ExternalLink, Copy, Check, PackageCheck } from 'lucide-react'

export interface CustomerShipment {
  id: string
  shipmentNumber?: number
  courierName: string
  awbCode: string
  trackingUrl?: string | null
  status: string
  shippedAt?: string | null
  deliveredAt?: string | null
}

function formatShippingStatus(status: string): string {
  return status.replace(/_/g, ' ')
}

function statusBadgeStyle(status: string): string {
  switch (status) {
    case 'DELIVERED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
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

export interface CustomerOrderTrackingProps {
  order: {
    id: string
    shipments?: CustomerShipment[]
    awbCode?: string | null
    courierName?: string | null
    trackingUrl?: string | null
    shippingStatus?: string | null
    shippedAt?: string | null
    deliveredAt?: string | null
  }
}

export default function CustomerOrderTracking({ order }: CustomerOrderTrackingProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const shipments: CustomerShipment[] =
    Array.isArray(order?.shipments) && order.shipments.length > 0
      ? order.shipments
      : order?.awbCode || order?.trackingUrl || (order?.shippingStatus && order.shippingStatus !== 'NOT_CREATED')
      ? [
          {
            id: `legacy-${order.id}`,
            shipmentNumber: 1,
            courierName: order.courierName || 'Courier Partner',
            awbCode: order.awbCode || 'Pending AWB',
            trackingUrl: order.trackingUrl || null,
            status: order.shippingStatus || 'SHIPPED',
            shippedAt: order.shippedAt || null,
            deliveredAt: order.deliveredAt || null,
          },
        ]
      : []

  if (shipments.length === 0) return null

  const copyAwb = async (id: string, awb: string) => {
    try {
      await navigator.clipboard.writeText(awb)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {}
  }

  return (
    <div className="mt-5 pt-5 border-t border-brand-linen">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 flex items-center gap-2">
          <Truck className="w-4 h-4 text-brand-orange" />
          Shipment Tracking
          {shipments.length > 1 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold normal-case">
              {shipments.length} Shipments
            </span>
          )}
        </h3>
      </div>

      <div className="space-y-3">
        {shipments.map((s, idx) => (
          <div
            key={s.id}
            className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-800">
                  <PackageCheck className="w-3.5 h-3.5 text-blue-700" />
                  Shipment {idx + 1}
                </span>
                <span className="text-sm font-semibold text-gray-900">{s.courierName}</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusBadgeStyle(
                    s.status
                  )}`}
                >
                  {formatShippingStatus(s.status)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  AWB / Tracking #:{' '}
                  <strong className="font-mono text-gray-900 select-all">{s.awbCode}</strong>
                  {s.awbCode && s.awbCode !== 'Pending AWB' && (
                    <button
                      type="button"
                      onClick={() => copyAwb(s.id, s.awbCode)}
                      className="text-gray-400 hover:text-gray-700"
                      title="Copy tracking number"
                    >
                      {copiedId === s.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </span>
                {s.deliveredAt ? (
                  <span className="text-emerald-700 font-medium">
                    Delivered {new Date(s.deliveredAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </span>
                ) : s.shippedAt ? (
                  <span className="text-gray-500">
                    Shipped {new Date(s.shippedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </span>
                ) : null}
              </div>
            </div>

            {s.trackingUrl && (
              <a
                href={s.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors shrink-0"
              >
                Track Shipment
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
