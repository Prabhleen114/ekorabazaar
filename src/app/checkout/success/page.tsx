'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import OrderSuccessClient from './OrderSuccessClient';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID was provided.');
      setLoading(false);
      return;
    }

    fetch(`/api/checkout/order-summary?orderId=${encodeURIComponent(orderId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Order not found.');
        }
        return res.json();
      })
      .then((data) => {
        if (data.order) {
          setOrder(data.order);
        } else {
          setError('Order not found.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load order details. Please contact support.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-stone-500 font-sans text-sm">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin mb-3" />
        <p>Loading your order confirmation...</p>
      </div>
    );
  }

  return <OrderSuccessClient order={order} error={error} />;
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-stone-500 font-sans text-sm">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin mb-3" />
          <p>Loading your order confirmation...</p>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
