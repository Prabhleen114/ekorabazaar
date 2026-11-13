'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Package, Truck, MessageCircle, ArrowRight, ShieldCheck, Video } from 'lucide-react';
import { clearGuestCart } from '@/lib/guest-cart';

interface OrderItemSummary {
  id: string;
  productNameSnapshot: string;
  quantity: number;
  priceSnapshot: number;
  subtotal: number;
}

interface OrderSummaryProps {
  order: {
    id: string;
    total: number;
    subtotal: number;
    shipping: number;
    discount: number;
    createdAt: string;
    status: string;
    paymentStatus: string;
    addressSnapshot: {
      fullName?: string;
      name?: string;
      phone?: string;
      line1?: string;
      addressLine1?: string;
      line2?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      pincode?: string;
    } | null;
    items: OrderItemSummary[];
  } | null;
  error?: string;
}

export default function OrderSuccessClient({ order, error }: OrderSummaryProps) {
  useEffect(() => {
    // Clear guest cart from localStorage and notify other components
    clearGuestCart();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ekora_applied_coupon');
    }
  }, []);

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-serif text-stone-900 mb-2">Order Information</h1>
        <p className="text-stone-600 mb-6">
          {error || "We couldn't locate this order's details. If you completed a payment, your order has been registered securely."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://wa.me/919041500605?text=Hi%20Ekora%20Team%2C%20I%20just%20completed%20checkout%20and%20need%20confirmation."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Support (+91 9041500605)
          </a>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Delivery estimation: +6 to 8 business days
  const createdDate = new Date(order.createdAt);
  const minDeliveryDate = new Date(createdDate);
  minDeliveryDate.setDate(minDeliveryDate.getDate() + 6);
  const maxDeliveryDate = new Date(createdDate);
  maxDeliveryDate.setDate(maxDeliveryDate.getDate() + 8);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

  const addr = order.addressSnapshot;
  const customerName = addr?.fullName || addr?.name || 'Valued Creator';
  const addressLine = addr?.addressLine1 || addr?.line1 || '';
  const cityState = [addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(', ');

  const whatsappMessage = `Hi Ekora Team, I have an inquiry about my Order #${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Success Banner */}
      <div className="text-center pb-8 border-b border-stone-200">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <span className="inline-block text-xs uppercase tracking-widest font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full mb-3">
          Payment Successful &bull; Order Confirmed
        </span>
        <h1 className="text-3xl md:text-4xl font-serif text-stone-900 mb-2">
          Thank you for your order, {customerName.split(' ')[0]}!
        </h1>
        <p className="text-stone-600 text-sm max-w-lg mx-auto">
          We&apos;ve received your order and are preparing your crafting supplies with care.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-lg text-sm text-stone-800 font-mono">
          <span>Order ID:</span>
          <strong className="text-stone-950 font-bold select-all">#{order.id.slice(0, 8).toUpperCase()}</strong>
          <span className="text-xs text-stone-400">({order.id})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        {/* Estimated Delivery Card */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3 text-stone-900">
            <Truck className="w-5 h-5 text-amber-700" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Estimated Delivery</h2>
          </div>
          <p className="text-xl font-bold text-stone-900">
            {formatDate(minDeliveryDate)} &ndash; {formatDate(maxDeliveryDate)}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Standard tracked surface courier via Shiprocket
          </p>
        </div>

        {/* Delivery Address Card */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3 text-stone-900">
            <Package className="w-5 h-5 text-stone-700" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Delivery Address</h2>
          </div>
          <p className="font-medium text-sm text-stone-900">{customerName}</p>
          <p className="text-xs text-stone-600 mt-0.5">{addressLine}</p>
          <p className="text-xs text-stone-600">{cityState}</p>
          {addr?.phone && (
            <p className="text-xs text-stone-500 mt-1">Phone: {addr.phone}</p>
          )}
        </div>

        {/* WhatsApp Updates Card */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3 text-stone-900">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">Need Instant Help?</h2>
            </div>
            <p className="text-xs text-stone-600">
              Direct dispatch assistance, tracking inquiries, or GST invoice support on WhatsApp.
            </p>
          </div>
          <a
            href={`https://wa.me/919041500605?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Chat with Ekora Support
          </a>
        </div>
      </div>

      {/* Mandatory Unboxing Video Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-5 mb-8 flex items-start gap-3.5">
        <Video className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs md:text-sm text-amber-900">
          <strong className="font-semibold block mb-1">
            Important Return &amp; Replacement Policy:
          </strong>
          To qualify for transit damage replacement, please record a continuous, uncut 360° unboxing video showing the outer sealed courier package, shipping label, and internal item inspection upon arrival.
        </div>
      </div>

      {/* Order Summary & Items Breakdown */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm mb-8">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
          <h2 className="font-serif text-base font-semibold text-stone-900">Items in This Order</h2>
          <span className="text-xs text-stone-500">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
        </div>
        <div className="divide-y divide-stone-100">
          {order.items.map((item) => (
            <div key={item.id} className="p-4 md:p-6 flex items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-stone-900 leading-snug">
                  {item.productNameSnapshot}
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Qty: {item.quantity} &times; ₹{(item.priceSnapshot / 100).toFixed(2)}
                </p>
              </div>
              <div className="text-sm font-semibold text-stone-900">
                ₹{(item.subtotal / 100).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Totals */}
        <div className="bg-stone-50 p-6 border-t border-stone-200 space-y-2">
          <div className="flex justify-between text-sm text-stone-600">
            <span>Subtotal</span>
            <span>₹{(order.subtotal / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-stone-600">
            <span>Standard Flat Shipping</span>
            <span>₹{(order.shipping / 100).toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm text-emerald-700 font-medium">
              <span>Coupon Discount</span>
              <span>-₹{(order.discount / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-stone-950 pt-2 border-t border-stone-200">
            <span>Total Paid (Prepaid)</span>
            <span>₹{(order.total / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200">
        <Link
          href="/shop"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/account/orders"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-stone-300 text-stone-700 px-6 py-3 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
        >
          View in Account Orders
        </Link>
      </div>
    </div>
  );
}
