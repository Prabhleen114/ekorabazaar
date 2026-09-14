'use client';
import { useState } from 'react';
import { ShippingStatus } from '@prisma/client';

export default function ShippingActions({ orderId, status, awb, courier, shiprocketId, shipmentId }: { 
  orderId: string, 
  status: string,
  awb?: string | null,
  courier?: string | null,
  shiprocketId?: string | null,
  shipmentId?: string | null
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const doAction = async (action: string) => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Failed');
      } else {
        if (data.labelUrl) {
          window.open(data.labelUrl, '_blank');
        }
        setMsg(data.message || 'Success');
        window.location.reload();
      }
    } catch (e: any) {
      setMsg(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h2 className="font-semibold text-gray-900">Shiprocket Shipping</h2>
        <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{status}</span>
      </div>
      <div className="p-4 text-sm space-y-4">
        {shiprocketId && (
          <div className="flex justify-between">
            <span className="text-gray-500">SR Order ID</span>
            <span className="font-medium text-gray-900">{shiprocketId}</span>
          </div>
        )}
        {shipmentId && (
          <div className="flex justify-between">
            <span className="text-gray-500">Shipment ID</span>
            <span className="font-medium text-gray-900">{shipmentId}</span>
          </div>
        )}
        {awb && (
          <div className="flex justify-between">
            <span className="text-gray-500">AWB Code</span>
            <span className="font-medium text-gray-900">{awb}</span>
          </div>
        )}
        {courier && (
          <div className="flex justify-between">
            <span className="text-gray-500">Courier</span>
            <span className="font-medium text-gray-900">{courier}</span>
          </div>
        )}
        
        {msg && <div className="text-xs text-red-500 font-medium">{msg}</div>}

        <div className="flex gap-2 flex-wrap pt-2">
          {status === 'NOT_CREATED' && (
            <button disabled={loading} onClick={() => doAction('CREATE')} className="px-4 py-2 bg-brand-charcoal text-white rounded-lg text-xs font-medium hover:bg-black disabled:opacity-50 transition-colors">
              Create Shipment
            </button>
          )}
          {status === 'CREATED' && (
            <button disabled={loading} onClick={() => doAction('ASSIGN_AWB')} className="px-4 py-2 bg-brand-charcoal text-white rounded-lg text-xs font-medium hover:bg-black disabled:opacity-50 transition-colors">
              Assign AWB
            </button>
          )}
          {status === 'AWB_ASSIGNED' && (
            <button disabled={loading} onClick={() => doAction('REQUEST_PICKUP')} className="px-4 py-2 bg-brand-charcoal text-white rounded-lg text-xs font-medium hover:bg-black disabled:opacity-50 transition-colors">
              Request Pickup
            </button>
          )}
          {status !== 'NOT_CREATED' && status !== 'CREATED' && (
            <button disabled={loading} onClick={() => doAction('GENERATE_LABEL')} className="px-4 py-2 bg-brand-charcoal text-white rounded-lg text-xs font-medium hover:bg-black disabled:opacity-50 transition-colors">
              Download Label
            </button>
          )}
        </div>
      </div>
    </div>
  );
}