"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Minus, Plus, ShoppingCart, Loader2, Check, Truck, ShieldCheck, Lock, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import { trackWhatsAppClick, trackEvent } from "@/lib/tracking";
import { openMiniCart } from "@/components/MiniCartDrawer";

type Tier = {
  minQty: number;
  maxQty: number | null;
  price: number;
  discountPct: number;
};

export type ProductVariant = {
  size: string;
  price: number;
  tiers?: Tier[];
};

export default function PricingWidget({ 
  productId, 
  productName,
  sellerId,
  basePrice,
  tiers = [], 
  variants = [],
  moq = 1, 
  category,
  isQuoteOnly = false,
  inStock = true
}: { 
  productId?: string; 
  productName?: string;
  sellerId?: string | null;
  basePrice?: number; 
  tiers: Tier[]; 
  variants?: ProductVariant[];
  moq?: number; 
  category?: string;
  isQuoteOnly?: boolean;
  inStock?: boolean;
}) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants && variants.length > 0 ? variants[0] : null
  );
  const [quantity, setQuantity] = useState(moq);
  const [errorMsg, setErrorMsg] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const hasTrackedTierView = useRef(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  // Load saved pincode from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPin = localStorage.getItem("ekora_delivery_pincode");
      if (savedPin && savedPin.length === 6) {
        setPincode(savedPin);
        setPincodeChecked(true);
      }
    }
  }, []);

  // Calculate estimated delivery date: 6 calendar days from now (added 2 days per dispatch schedule)
  const estimatedDeliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  }, []);

  // Active tiers and price derived from selectedVariant if present
  const activeTiers = (selectedVariant && selectedVariant.tiers && selectedVariant.tiers.length > 0)
    ? selectedVariant.tiers
    : tiers;
  const activeBasePrice = selectedVariant
    ? selectedVariant.price
    : (basePrice ?? (tiers.length > 0 ? tiers[0].price : 0));

  // Determine current active tier based on quantity
  const currentTier = useMemo(() => {
    if (!activeTiers || activeTiers.length === 0) return null;
    const sorted = [...activeTiers].sort((a, b) => b.minQty - a.minQty);
    return sorted.find(t => quantity >= t.minQty) || activeTiers[0];
  }, [activeTiers, quantity]);

  const displayPrice = currentTier ? currentTier.price : activeBasePrice;
  const subtotal = displayPrice * quantity;

  // Track sticky bar visibility when main CTAs leave viewport
  useEffect(() => {
    if (!ctaRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Show sticky bar only once main CTA scrolls out of view
        setShowStickyBar(!entries[0].isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  // Track tier_pricing_view
  useEffect(() => {
    if (!hasTrackedTierView.current && tiers && tiers.length > 0) {
      hasTrackedTierView.current = true;
      trackEvent("tier_pricing_view", {
        productId,
        productName,
        category,
        tiersCount: tiers.length,
        basePrice,
        tiers,
      });
    }
  }, [productId, productName, category, basePrice, tiers]);

  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(moq, newQty);
    setQuantity(validQty);
  };

  const handleAction = async (actionType: 'cart' | 'buy_now') => {
    if (quantity < moq) {
      setErrorMsg(`Minimum order quantity is ${moq}`);
      return;
    }

    const isProcessing = isAddingToCart || isBuyingNow;
    if (isProcessing) return;

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
          const { addGuestCartItem } = await import('@/lib/guest-cart');
          addGuestCartItem({
            productId: productId || "unknown",
            quantity,
            title: productName ? (selectedVariant ? `${productName} (${selectedVariant.size})` : productName) : "Wholesale Item",
            basePrice: displayPrice
          });
          setIsAddedSuccess(true);
          
          sendGAEvent('event', 'add_to_cart', {
            currency: 'INR',
            value: displayPrice * quantity,
            items: [
              {
                item_id: productId,
                item_name: productName,
                item_category: category,
                price: displayPrice,
                quantity: quantity
              }
            ]
          });

          // Open mini-cart drawer without page reload
          openMiniCart();

          setTimeout(() => {
            setIsAddedSuccess(false);
            setIsAddingToCart(false);
          }, 2500);
          return;
        }
        if (!res.ok) throw new Error('Failed to add to cart');
        
        setIsAddedSuccess(true);
        const { notifyCartUpdated } = await import('@/lib/guest-cart');
        notifyCartUpdated();
        
        sendGAEvent('event', 'add_to_cart', {
          currency: 'INR',
          value: displayPrice * quantity,
          items: [
            {
              item_id: productId,
              item_name: productName,
              item_category: category,
              price: displayPrice,
              quantity: quantity
            }
          ]
        });

        // Open mini-cart drawer without page reload
        openMiniCart();

        setTimeout(() => {
          setIsAddedSuccess(false);
          setIsAddingToCart(false);
        }, 2500);

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
          const { addGuestCartItem } = await import('@/lib/guest-cart');
          addGuestCartItem({
            productId: productId || "unknown",
            quantity,
            title: productName ? (selectedVariant ? `${productName} (${selectedVariant.size})` : productName) : "Wholesale Item",
            basePrice: displayPrice
          });
          
          sendGAEvent('event', 'add_to_cart', {
            currency: 'INR',
            value: displayPrice * quantity,
            items: [
              { item_id: productId, item_name: productName, item_category: category, price: displayPrice, quantity }
            ]
          });
        }

        // Store pincode in localStorage if entered
        if (pincode && pincode.length === 6) {
          localStorage.setItem('ekora_delivery_pincode', pincode);
        }

        router.push('/checkout');
      } catch (err: any) {
        setErrorMsg(err.message);
        setIsBuyingNow(false);
      }
    }
  };

  const isProcessing = isAddingToCart || isBuyingNow;

  return (
    <>
      <div className="bg-white p-4 sm:p-6 border border-stone-200 mt-4 sm:mt-6 space-y-5 shadow-xs">
        {/* 1. PRICE HIERARCHY HEADER */}
        <div className="pb-3 border-b border-stone-200 flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-sans block mb-1">
              Wholesale Price
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-sans font-bold text-stone-900">
                ₹{displayPrice.toLocaleString()}
              </span>
              <span className="text-xs text-stone-500 font-sans">/ unit</span>
              {currentTier && currentTier.discountPct > 0 && (
                <span className="ml-1 text-xs font-sans font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                  Save {currentTier.discountPct}%
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500 font-sans block">
              Subtotal
            </span>
            <span className="text-lg font-sans font-bold text-stone-950">
              ₹{subtotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 2. SIZE CHIPS (44px tall, horizontally scrollable row, price printed on each chip) */}
        {variants && variants.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-sans">
                Select Size / Volume
              </label>
              <span className="text-[11px] font-sans font-semibold text-stone-900">
                {selectedVariant?.size} &bull; ₹{selectedVariant?.price}
              </span>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-2 py-1 -mx-1 px-1">
              {variants.map((v, idx) => {
                const isSelected = selectedVariant?.size === v.size;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedVariant(v);
                      trackEvent("variant_select", {
                        productId,
                        productName,
                        size: v.size,
                        price: v.price
                      });
                    }}
                    className={`min-h-[44px] h-11 px-4 py-2 text-xs sm:text-sm font-sans font-medium transition-all border whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-stone-900 text-stone-50 border-stone-900 font-semibold shadow-xs"
                        : "bg-white text-stone-800 border-stone-300 hover:border-stone-500"
                    }`}
                  >
                    <span>{v.size}</span>
                    <span className={isSelected ? "text-amber-200 font-bold" : "text-stone-500 font-medium"}>
                      ₹{v.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. QUANTITY: 44PX STEPPER, QUICK-PICK BUTTONS & LIVE TIER LINE */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-sans">
              Quantity
            </label>
            {/* Live Tier Discount Line (replaces 3 bulky slab cards) */}
            <div className="text-xs font-sans text-right">
              {currentTier && currentTier.discountPct > 0 ? (
                <span className="text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200/90 px-2 py-0.5">
                  Buy {currentTier.minQty}+, pay ₹{displayPrice} each (Save {currentTier.discountPct}%)
                </span>
              ) : (
                (() => {
                  const nextDiscountTier = activeTiers?.find(t => t.discountPct > 0);
                  if (nextDiscountTier) {
                    return (
                      <span className="text-stone-600">
                        Buy {nextDiscountTier.minQty}+, pay <strong className="text-stone-900">₹{nextDiscountTier.price}</strong> each (Save {nextDiscountTier.discountPct}%)
                      </span>
                    );
                  }
                  return <span className="text-stone-400">Standard Atelier Price</span>;
                })()
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* 44px Stepper */}
            <div className="flex items-center border border-stone-300 h-11 bg-white shrink-0">
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity - 1)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || moq;
                  handleQuantityChange(val);
                }}
                className="w-14 text-center text-base font-sans font-bold text-stone-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity + 1)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick-Pick Pills for 1, 10, 50 */}
            <div className="flex items-center gap-1.5">
              {[1, 10, 50].map((quickQty) => (
                <button
                  key={quickQty}
                  type="button"
                  onClick={() => handleQuantityChange(quickQty)}
                  className={`min-h-[44px] min-w-[44px] px-3.5 h-11 text-xs font-sans font-semibold border transition-all ${
                    quantity === quickQty
                      ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                      : "bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-stone-50"
                  }`}
                >
                  {quickQty}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. PINCODE DELIVERY ESTIMATOR (Numeric keyboard, 6 digits, 16px font, flat shipping ₹90, no free shipping) */}
        <div className="p-3.5 bg-stone-50 border border-stone-200/90 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-[0.18em] text-stone-600 font-sans font-semibold flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-stone-600" />
              <span>Delivery &amp; Shipping Estimate</span>
            </label>
            <span className="text-[10px] text-stone-400 font-sans">Pan-India</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Enter 6-digit Pincode"
              value={pincode}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                setPincode(val);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('ekora_delivery_pincode', val);
                }
              }}
              className="flex-1 bg-white border border-stone-300 px-3 py-2 text-base font-sans text-stone-900 rounded-none focus:outline-none focus:border-stone-900 min-h-[44px]"
            />
            <button
              type="button"
              onClick={() => {
                if (pincode.length === 6) {
                  setPincodeChecked(true);
                }
              }}
              className="min-h-[44px] px-4 bg-stone-900 text-white text-xs uppercase tracking-wider font-semibold hover:bg-black transition-colors"
            >
              Check
            </button>
          </div>

          {pincodeChecked && pincode.length === 6 ? (
            <div className="text-xs font-sans text-stone-700 pt-1 space-y-0.5">
              <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Estimated Delivery: {estimatedDeliveryDate}</span>
              </p>
              <p className="text-[11px] text-stone-600">
                Standard Flat Shipping: <strong>₹90</strong> &bull; Dispatches in 24 Hours from Muzaffarpur, Bihar
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-stone-500 font-sans">
              Flat ₹90 express dispatch across all 19,000+ Indian pincodes &bull; 24h dispatch &bull; No COD
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="text-red-700 text-xs font-sans bg-red-50 p-2.5 border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* 5. PRIMARY ACTION BUTTONS: ADD TO CART & BUY NOW */}
        <div className="space-y-2.5 pt-1" ref={ctaRef}>
          <button 
            type="button"
            onClick={() => handleAction('cart')}
            disabled={isProcessing}
            className="w-full bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold py-4 rounded-none transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-75 shadow-xs min-h-[48px]"
          >
            {isAddingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAddedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <ShoppingCart className="w-4 h-4" />)} 
            <span>{isAddingToCart ? "Adding to Cart..." : (isAddedSuccess ? "Added ✓" : "Add to Cart")}</span>
          </button>
          
          <button 
            type="button"
            onClick={() => handleAction('buy_now')}
            disabled={isProcessing}
            className="w-full border border-stone-900 bg-brand-orange text-stone-50 hover:bg-brand-terracotta text-xs uppercase tracking-[0.18em] font-semibold py-3.5 rounded-none transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-75 min-h-[48px]"
          >
            {isBuyingNow ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy Now"}
          </button>
        </div>

        {/* 6. TRUST & POLICY LINES DIRECTLY BENEATH CTAS */}
        <div className="pt-3 border-t border-stone-200 space-y-2 text-[11px] font-sans text-stone-600">
          <div className="flex items-start gap-2">
            <CreditCard className="w-3.5 h-3.5 text-stone-800 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900">UPI First:</strong> Google Pay, PhonePe, Paytm, Cards &amp; NetBanking. <span className="text-stone-700 font-medium">No COD offered.</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900">Damage Replacement Only:</strong> Requires uncut unboxing video within 24h. <a href="#returns-policy" className="text-stone-900 underline font-medium">View Policy &rarr;</a>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900">GST Invoice:</strong> 18% Input Tax Credit (ITC) compliant invoice included on every order.
            </div>
          </div>
        </div>
      </div>

      {/* 7. STICKY BOTTOM ACTION BAR (Appears only when main buttons scroll out of view) */}
      {showStickyBar && (
        <div 
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-3 z-40 flex items-center justify-between shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.08)]" 
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="flex flex-col pr-2">
            <span className="text-[9px] uppercase tracking-wider text-stone-500 font-sans truncate max-w-[140px]">
              {selectedVariant ? `${selectedVariant.size} • ` : ""}Qty: {quantity}
            </span>
            <span className="text-base font-sans font-bold text-stone-900">
              ₹{subtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <button 
              type="button"
              onClick={() => handleAction('cart')}
              disabled={isProcessing}
              className="bg-stone-900 text-stone-50 px-4 py-3 text-xs uppercase tracking-wider font-sans font-semibold flex items-center justify-center min-h-[44px]"
            >
              {isAddedSuccess ? "Added ✓" : "Add to Cart"}
            </button>
            <button 
              type="button"
              onClick={() => handleAction('buy_now')}
              disabled={isProcessing}
              className="bg-brand-orange text-stone-50 px-4 py-3 text-xs uppercase tracking-wider font-sans font-semibold flex items-center justify-center min-h-[44px]"
            >
              {isBuyingNow ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy Now"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
