'use client';

import { useState } from 'react';
import { Tag, Check, X, Loader2, AlertCircle } from 'lucide-react';

export interface AppliedCoupon {
  code: string;
  discountAmountPaise: number;
  discountAmountRupees: number;
  description?: string | null;
}

interface CouponSectionProps {
  subtotalPaise: number;
  appliedCoupon: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
  disabled?: boolean;
  className?: string;
}

export default function CouponSection({
  subtotalPaise,
  appliedCoupon,
  onApply,
  onRemove,
  disabled = false,
  className = ''
}: CouponSectionProps) {
  const [couponInput, setCouponInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setErrorMsg('Please enter a coupon code.');
      return;
    }

    if (subtotalPaise <= 0) {
      setErrorMsg('Cannot apply coupons to an empty cart.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotalPaise })
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        throw new Error(data.error || 'Invalid or ineligible coupon code.');
      }

      const validated: AppliedCoupon = {
        code: data.coupon.code,
        discountAmountPaise: data.coupon.discountAmountPaise,
        discountAmountRupees: data.coupon.discountAmountRupees,
        description: data.coupon.description
      };

      onApply(validated);
      setCouponInput('');
      setSuccessMsg(`Coupon "${validated.code}" applied! You saved ₹${validated.discountAmountRupees.toLocaleString('en-IN')}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply coupon.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    setErrorMsg('');
    setSuccessMsg('');
    setCouponInput('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {appliedCoupon ? (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs uppercase tracking-wider text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                  {appliedCoupon.code}
                </span>
                <span className="text-xs text-emerald-700 font-semibold">Applied</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5 truncate">
                Saved ₹{appliedCoupon.discountAmountRupees.toLocaleString('en-IN')}
                {appliedCoupon.description ? ` • ${appliedCoupon.description}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline shrink-0 px-2 py-1"
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-brand-orange" />
            Apply Coupon Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Coupon Code"
              value={couponInput}
              disabled={disabled || loading}
              onChange={(e) => {
                setCouponInput(e.target.value.toUpperCase());
                setErrorMsg('');
              }}
              className="flex-1 border border-brand-linen rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase font-bold tracking-wider placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:tracking-normal focus:border-brand-orange focus:outline-none transition-colors bg-white disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={disabled || loading || !couponInput.trim()}
              className="bg-brand-charcoal hover:bg-brand-charcoal/90 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-w-[70px]"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
            </button>
          </div>
        </form>
      )}

      {errorMsg && (
        <div className="flex items-start gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
          {successMsg}
        </div>
      )}
    </div>
  );
}
