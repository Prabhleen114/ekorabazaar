"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";

type Tier = {
  minQty: number;
  maxQty: number | null;
  price: number;
  discountPct: number;
};

export default function PricingWidget({ tiers, moq = 1 }: { basePrice?: number; tiers: Tier[]; moq?: number }) {
  const [quantity, setQuantity] = useState(moq);

  const currentTier = tiers.find(t => quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty)) || tiers[0];
  const subtotal = currentTier.price * quantity;

  return (
    <>
      <div className="bg-brand-bg rounded-2xl p-6 border border-brand-linen mt-8">
      <h3 className="font-bold text-brand-charcoal mb-4">Wholesale Pricing Tiers</h3>
      
      <div className="space-y-2 mb-6">
        {tiers.map((tier, idx) => {
          const isActive = currentTier === tier;
          return (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                isActive ? "bg-white border-brand-orange shadow-sm" : "border-transparent text-brand-charcoal/60"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`font-semibold ${isActive ? "text-brand-orange" : ""}`}>
                  {tier.maxQty ? `${tier.minQty} - ${tier.maxQty}` : `${tier.minQty}+`} units
                </span>
                {tier.discountPct > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                    {tier.discountPct}% OFF
                  </span>
                )}
              </div>
              <div className={`font-bold ${isActive ? "text-brand-charcoal" : ""}`}>
                ₹{tier.price} <span className="text-xs font-normal opacity-70">/ unit</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-brand-linen flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/50 block mb-2">Quantity</label>
          <div className="flex items-center bg-white border border-brand-linen rounded-xl overflow-hidden h-12 w-36">
            <button 
              onClick={() => setQuantity(Math.max(moq, quantity - 1))}
              className="w-12 h-full flex items-center justify-center text-brand-charcoal/50 hover:bg-brand-linen/50 hover:text-brand-charcoal transition-colors min-w-[44px]"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input 
              type="number" 
              value={quantity}
              onChange={(e) => setQuantity(Math.max(moq, parseInt(e.target.value) || moq))}
              className="flex-1 w-full text-center font-semibold text-brand-charcoal focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-full flex items-center justify-center text-brand-charcoal/50 hover:bg-brand-linen/50 hover:text-brand-charcoal transition-colors min-w-[44px]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile: Subtotal shown inline (above sticky bar) */}
        <div className="md:hidden text-right flex-1 w-full">
          <div className="text-sm text-brand-charcoal/50 font-medium mb-1">Subtotal</div>
          <div className="text-2xl font-bold text-brand-charcoal">₹{subtotal.toLocaleString()}</div>
        </div>

        <div className="text-right flex-1 w-full sm:w-auto hidden md:block">
          <div className="text-sm text-brand-charcoal/50 font-medium mb-1">Subtotal</div>
          <div className="text-2xl font-bold text-brand-charcoal mb-4">₹{subtotal.toLocaleString()}</div>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'add_to_cart', {
                  currency: 'INR',
                  value: subtotal,
                  items: [{ price: currentTier.price, quantity }]
                });
              }
              alert("Added to Cart successfully! (Demo)");
            }}
            className="w-full bg-brand-orange hover:bg-brand-terracotta text-white py-3.5 rounded-xl font-semibold transition-all shadow-md shadow-brand-orange/15 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" /> Add to Cart
          </button>
        </div>
      </div>
    </div>

    {/* Mobile Sticky Add to Cart Bar */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-linen p-4 z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] flex items-center justify-between" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-brand-charcoal/50 uppercase tracking-wider">Subtotal</span>
        <span className="text-lg font-bold text-brand-charcoal">₹{subtotal.toLocaleString()}</span>
      </div>
      <button 
        onClick={() => {
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'add_to_cart', {
              currency: 'INR',
              value: subtotal,
              items: [{ price: currentTier.price, quantity }]
            });
          }
          alert("Added to Cart successfully! (Demo)");
        }}
        className="bg-brand-orange text-white px-6 py-3.5 rounded-xl font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/20 min-h-[48px]"
      >
        <ShoppingCart className="w-5 h-5" /> Add to Cart
      </button>
    </div>
    </>
  );
}
