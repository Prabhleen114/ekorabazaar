"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";

type Tier = {
  minQty: number;
  maxQty: number | null;
  price: number;
  discountPct: number;
};

export default function PricingWidget({ productId, tiers, moq = 1, category }: { productId?: string; basePrice?: number; tiers: Tier[]; moq?: number; category?: string }) {
  const [quantity, setQuantity] = useState(moq);
  const [errorMsg, setErrorMsg] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const router = useRouter();

  const handleAction = async (actionType: 'cart' | 'buy_now') => {
    if (!productId) return;
    
    if (actionType === 'cart') {
      setIsAddingToCart(true);
      setErrorMsg("");
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity })
        });
        if (res.status === 401 || res.status === 403) {
          router.push(`/login?redirect=/products/${productId}`);
          return;
        }
        if (!res.ok) throw new Error('Failed to add to cart');
        
        setIsAddedSuccess(true);
        
        setTimeout(() => {
          // Attempt to go back smoothly if they came from our shop
          if (document.referrer && document.referrer.includes(window.location.host) && document.referrer.includes('/shop')) {
            router.back();
          } else if (category) {
            router.push(`/shop?category=${encodeURIComponent(category)}`);
          } else {
            router.push('/shop');
          }
        }, 1200);

      } catch (err: any) {
        setErrorMsg(err.message);
        setIsAddingToCart(false);
      }
      return;
    }

    if (actionType === 'buy_now') {
      setIsBuyingNow(true);
      setErrorMsg("");
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity })
        });
        if (res.status === 401 || res.status === 403) {
          router.push(`/login?redirect=/products/${productId}`);
          return;
        }
        if (!res.ok) throw new Error('Failed to proceed to checkout');
        router.push('/checkout');
      } catch (err: any) {
        setErrorMsg(err.message);
        setIsBuyingNow(false);
      }
    }
  };

  const currentTier = tiers.find(t => quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty)) || tiers[0];
  const subtotal = currentTier.price * quantity;

  const isProcessing = isAddingToCart || isBuyingNow || isAddedSuccess;

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
          {errorMsg && <div className="text-red-500 text-xs font-semibold mb-2">{errorMsg}</div>}
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleAction('cart')}
              disabled={isProcessing}
              className={`w-full text-white py-3.5 rounded-xl font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-90 disabled:cursor-not-allowed ${isAddedSuccess ? "bg-emerald-600 hover:bg-emerald-700" : "bg-brand-charcoal hover:bg-brand-charcoal/90"}`}
            >
              {isAddingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : (isAddedSuccess ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />)} 
              {isAddingToCart ? "Adding..." : (isAddedSuccess ? "Added to cart ✓" : "Add to Cart")}
            </button>
            <button 
              onClick={() => handleAction('buy_now')}
              disabled={isProcessing}
              className="w-full bg-brand-orange hover:bg-brand-terracotta text-white py-3.5 rounded-xl font-semibold transition-all shadow-md shadow-brand-orange/15 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isBuyingNow ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buy Now"}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Mobile Sticky Add to Cart Bar */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-linen p-4 z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] flex items-center justify-between" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-brand-charcoal/50 uppercase tracking-wider">Subtotal</span>
        <span className="text-lg font-bold text-brand-charcoal">₹{subtotal.toLocaleString()}</span>
      </div>
      <div className="flex flex-col gap-1 items-end flex-1 ml-4">
        {errorMsg && <span className="text-red-500 text-[10px] font-semibold">{errorMsg}</span>}
        <div className="flex gap-2 w-full justify-end">
          <button 
            onClick={() => handleAction('cart')}
            disabled={isProcessing}
            className={`${isAddedSuccess ? "bg-emerald-600 text-white" : "bg-brand-charcoal text-white"} px-4 py-3 rounded-xl font-semibold active:scale-[0.98] transition-all flex items-center justify-center shadow-lg min-h-[48px] disabled:opacity-90 disabled:cursor-not-allowed`}
          >
            {isAddingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : (isAddedSuccess ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />)}
          </button>
          <button 
            onClick={() => handleAction('buy_now')}
            disabled={isProcessing}
            className="flex-1 bg-brand-orange text-white px-4 py-3 rounded-xl font-semibold active:scale-[0.98] transition-all flex items-center justify-center shadow-lg shadow-brand-orange/20 min-h-[48px] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isBuyingNow ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
