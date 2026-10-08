"use client";
import { useState, useEffect, useRef } from "react";
import { Minus, Plus, ShoppingCart, Loader2, Check, MessageCircle, Truck, ShieldCheck, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import { trackWhatsAppClick, trackEvent } from "@/lib/tracking";

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
  const [showStickyBar, setShowStickyBar] = useState(true);
  const hasTrackedTierView = useRef(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  // Active tiers and price derived from selectedVariant if present
  const activeTiers = (selectedVariant && selectedVariant.tiers && selectedVariant.tiers.length > 0)
    ? selectedVariant.tiers
    : tiers;
  const activeBasePrice = selectedVariant
    ? selectedVariant.price
    : (basePrice ?? (tiers.length > 0 ? tiers[0].price : 0));

  useEffect(() => {
    if (!ctaRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Hide sticky bar if main CTAs are visible
        setShowStickyBar(!entries[0].isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  // Track tier_pricing_view when wholesale tiers are visible to user
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

  if (isQuoteOnly || !inStock || !tiers || tiers.length === 0) {
    const whatsappUrl = `https://wa.me/919041500605?text=${encodeURIComponent(
      `Hi, I would like to request a wholesale quotation for ${productName || "this product"} (Product ID: ${productId || "N/A"}). Please share MOQ, tier pricing, and availability.`
    )}`;

    return (
      <>
        <div className="bg-brand-bg rounded-2xl p-6 border border-brand-linen mt-8 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md">
              Wholesale Sourcing
            </span>
          </div>
          <h3 className="text-xl font-bold text-brand-charcoal font-serif mb-2">
            Pricing on Direct Quotation
          </h3>
          <p className="text-sm text-brand-charcoal/70 leading-relaxed mb-6">
            This craft item is sourced on custom wholesale demand. Submit a quotation request to receive volume tier pricing, sample availability, and direct dispatch lead times from our verified craft suppliers.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick({
              location: "pdp_quote",
              productId,
              productName,
              category,
              extra: { basePrice, moq }
            })}
            className="w-full bg-brand-charcoal hover:bg-brand-charcoal/90 text-white py-3.5 px-4 md:px-6 rounded-xl font-semibold transition-all shadow-md flex items-center justify-center gap-2.5 text-center"
          >
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            Request Wholesale Quote on WhatsApp
          </a>

          <div className="mt-4 pt-4 border-t border-brand-linen/60 flex items-center justify-between text-xs text-brand-charcoal/60 flex-wrap gap-2">
            <span>✓ Verified Supplier Direct</span>
            <span>✓ Volume Tier Discounts</span>
            <span>✓ Safe GST Invoicing</span>
          </div>
        </div>

        {/* Mobile Sticky Quote Bar */}
        <div 
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-linen p-4 z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] flex items-center justify-between"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Pricing</span>
            <span className="text-base font-bold text-brand-charcoal">On Request</span>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick({
              location: "pdp_quote_sticky",
              productId,
              productName,
              category,
              extra: { basePrice, moq }
            })}
            className="bg-brand-charcoal text-white px-5 py-3 rounded-xl font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg min-h-[48px] text-sm"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            Request Quote
          </a>
        </div>
      </>
    );
  }

  const currentTier = activeTiers.find(t => quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty)) || null;
  const displayPrice = currentTier ? currentTier.price : activeBasePrice;
  const subtotal = displayPrice * quantity;

  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(moq, newQty);
    if (validQty !== quantity) {
      const prevTier = currentTier;
      const nextTier = activeTiers.find(t => validQty >= t.minQty && (t.maxQty === null || validQty <= t.maxQty)) || null;
      trackEvent("quantity_change", {
        productId,
        productName,
        oldQty: quantity,
        newQty: validQty,
        fromTier: prevTier ? prevTier.minQty : null,
        toTier: nextTier ? nextTier.minQty : null,
        tierCrossed: prevTier?.minQty !== nextTier?.minQty,
      });
      setQuantity(validQty);
    }
  };

  const handleAction = async (actionType: 'cart' | 'buy_now') => {
    if (!productId) return;

    trackEvent("add_to_cart", {
      productId,
      productName,
      quantity,
      unitPrice: displayPrice,
      subtotal,
      isBuyNow: actionType === 'buy_now',
      tierMinQty: currentTier?.minQty || null,
      discountPct: currentTier?.discountPct || 0,
    });
    
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
            productId,
            quantity,
            title: productName,
            basePrice
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

        // Show success state for 2.5s, then reset button — user stays on PDP
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
            productId,
            quantity,
            title: productName,
            basePrice
          });
          
          sendGAEvent('event', 'add_to_cart', {
            currency: 'INR',
            value: displayPrice * quantity,
            items: [
              { item_id: productId, item_name: productName, item_category: category, price: displayPrice, quantity }
            ]
          });
          sendGAEvent('event', 'begin_checkout', {
            currency: 'INR',
            value: displayPrice * quantity,
            items: [
              { item_id: productId, item_name: productName, item_category: category, price: displayPrice, quantity }
            ]
          });

          router.push('/checkout');
          return;
        }
        if (!res.ok) throw new Error('Failed to proceed to checkout');
        const { notifyCartUpdated } = await import('@/lib/guest-cart');
        notifyCartUpdated();
        
        sendGAEvent('event', 'add_to_cart', {
          currency: 'INR',
          value: displayPrice * quantity,
          items: [
            { item_id: productId, item_name: productName, item_category: category, price: displayPrice, quantity }
          ]
        });
        sendGAEvent('event', 'begin_checkout', {
          currency: 'INR',
          value: displayPrice * quantity,
          items: [
            { item_id: productId, item_name: productName, item_category: category, price: displayPrice, quantity }
          ]
        });

        router.push('/checkout');
      } catch (err: any) {
        setErrorMsg(err.message);
        setIsBuyingNow(false);
      }
    }
  };

  const isProcessing = isAddingToCart || isBuyingNow || isAddedSuccess;

  return (
    <>
      <div className="bg-white p-5 sm:p-6 border border-stone-200 mt-6 space-y-6 shadow-xs">
        {/* 1. PRICE HIERARCHY HEADER */}
        <div className="pb-4 border-b border-stone-200 flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono block mb-1">
              Unit Wholesale Price
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-stone-900">
                ₹{displayPrice}
              </span>
              <span className="text-xs text-stone-500 font-mono">/ unit</span>
              {currentTier && currentTier.discountPct > 0 && (
                <span className="ml-1 text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                  Save {currentTier.discountPct}%
                </span>
              )}
            </div>
          </div>
          {activeTiers.length > 1 && (
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#8C734B] font-mono block">
                Wholesale Tiers
              </span>
              <span className="text-xs font-mono text-stone-600">
                From ₹{activeTiers[activeTiers.length - 1].price} at {activeTiers[activeTiers.length - 1].minQty}+ units
              </span>
            </div>
          )}
        </div>

        {variants && variants.length > 0 && (
          <div className="pb-5 border-b border-stone-200">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono">
                Volume Variant
              </label>
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#8C734B] font-mono">
                {selectedVariant?.size}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
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
                    className={`px-3 py-2 text-xs font-mono transition-all border ${
                      isSelected
                        ? "bg-stone-900 text-stone-50 border-stone-900"
                        : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. WHOLESALE VOLUME SLABS WITH EXPLICIT SAVINGS MATH */}
        {activeTiers && activeTiers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono">
                Wholesale Volume Slabs
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#8C734B] font-mono">
                Click slab to select
              </span>
            </div>
            
            <div className="space-y-2.5">
              {activeTiers.map((tier, idx) => {
                const isActive = currentTier === tier;
                const perUnitSavings = activeBasePrice - tier.price;
                const totalTierSavings = perUnitSavings * tier.minQty;
                const labelQty = tier.maxQty 
                  ? `${tier.minQty}–${tier.maxQty} UNITS` 
                  : `${tier.minQty}+ UNITS`;

                return (
                  <div 
                    key={idx} 
                    onClick={() => handleQuantityChange(tier.minQty)}
                    onMouseEnter={() => trackEvent("tier_pricing_hover", {
                      productId,
                      productName,
                      tierMinQty: tier.minQty,
                      tierMaxQty: tier.maxQty,
                      price: tier.price,
                      discountPct: tier.discountPct,
                    })}
                    className={`p-3.5 border transition-all cursor-pointer relative ${
                      isActive 
                        ? "border-stone-900 bg-[#FAF8F5] ring-1 ring-stone-900/10 shadow-2xs" 
                        : "border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold ${isActive ? "text-stone-900" : "text-stone-700"}`}>
                          {labelQty}
                        </span>
                        {isActive && (
                          <span className="text-[9px] uppercase tracking-widest bg-stone-900 text-stone-50 px-1.5 py-0.2 font-mono">
                            Active Tier
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        {tier.discountPct > 0 ? (
                          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5">
                            SAVE {tier.discountPct}%
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-stone-500">
                            Standard price
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 border-t border-stone-100 gap-1 text-xs font-mono">
                      {perUnitSavings > 0 ? (
                        <div className="text-stone-600 space-y-0.5 text-[11px]">
                          <div>You save <span className="font-semibold text-emerald-700">₹{perUnitSavings}</span> per unit</div>
                          <div>Save <span className="font-semibold text-emerald-700">₹{totalTierSavings.toLocaleString()}</span> when buying {tier.minQty} units</div>
                        </div>
                      ) : (
                        <div className="text-stone-400 text-[11px]">
                          Standard atelier price per unit
                        </div>
                      )}
                      
                      <div className="text-right self-end sm:self-center mt-1 sm:mt-0">
                        <span className={`text-xs sm:text-sm font-semibold font-mono ${isActive ? "text-stone-900" : "text-stone-700"}`}>
                          You pay only <span className="text-base font-bold text-stone-950">₹{tier.price}</span> / unit
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. BATCH QUANTITY & ORDER SUBTOTAL (Tight Calculation Hierarchy) */}
        <div className="p-4 bg-stone-50 border border-stone-200">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono block mb-1.5">
                Batch Quantity
              </label>
              <div className="flex items-center border border-stone-300 h-11 w-36 bg-white">
                <button 
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="w-11 h-full flex items-center justify-center text-stone-600 hover:text-stone-950 hover:bg-stone-50 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input 
                  type="number" 
                  value={quantity}
                  min={moq}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || moq)}
                  className="flex-1 w-full text-center text-sm font-mono font-bold text-stone-900 focus:outline-none"
                />
                <button 
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="w-11 h-full flex items-center justify-center text-stone-600 hover:text-stone-950 hover:bg-stone-50 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono mb-0.5">
                Order Subtotal
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-stone-950">
                ₹{subtotal.toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-stone-500 mt-0.5">
                ({quantity} &times; ₹{displayPrice}/unit)
              </div>
            </div>
          </div>

          {/* Shipping Info embedded directly in calculation */}
          <div className="mt-3 pt-3 border-t border-stone-200 flex items-center justify-between text-[11px] font-mono text-stone-600 flex-wrap gap-1">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-stone-500" />
              Standard Flat Shipping: <strong className="text-stone-900">₹80</strong> across India
            </span>
            <span className="text-emerald-700 font-medium">
              &bull; Dispatches in 24 Hours
            </span>
          </div>
        </div>

        {errorMsg && <div className="text-stone-800 text-xs font-mono bg-stone-100 p-2 border border-stone-300">{errorMsg}</div>}

        {/* 4. PRIMARY ACTIONS: ADD TO CART, BUY NOW, SEND BULK ENQUIRY */}
        <div className="space-y-2.5 pt-1" ref={ctaRef}>
          <button 
            onClick={() => handleAction('cart')}
            disabled={isProcessing}
            className="w-full bg-brand-orange text-stone-50 hover:bg-brand-terracotta text-xs uppercase tracking-[0.2em] font-semibold py-4 rounded-none transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-75 shadow-xs"
          >
            {isAddingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAddedSuccess ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />)} 
            <span>{isAddingToCart ? "Adding to Cart..." : (isAddedSuccess ? "Added to Cart ✓" : "Add to Cart")}</span>
          </button>
          
          <button 
            onClick={() => handleAction('buy_now')}
            disabled={isProcessing}
            className="w-full border border-stone-900 bg-stone-900 text-stone-50 hover:bg-black text-xs uppercase tracking-[0.18em] font-semibold py-3.5 rounded-none transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {isBuyingNow ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy Now"}
          </button>

          {/* SEND BULK ENQUIRY (For custom orders / 50+ volume quotes) */}
          <a
            href={`https://wa.me/919041500605?text=${encodeURIComponent(
              `Hi Ekora! I would like to place a bulk enquiry for ${productName || "this product"} (SKU: ${productId || "N/A"}) for ${quantity} units. Please share bulk availability and direct quotation.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick({
              location: "pdp_bulk_enquiry",
              productId,
              productName,
              category,
              extra: { basePrice, moq, quantity }
            })}
            className="w-full border border-stone-300 text-stone-700 hover:border-stone-900 hover:text-stone-950 text-xs uppercase tracking-[0.18em] font-medium py-3 transition-colors duration-200 flex items-center justify-center gap-2 text-center bg-white"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Send Bulk Enquiry</span>
          </a>
        </div>
        
        {/* 5. REASSURANCE TRUST CARDS (Elevated from tiny metadata) */}
        <div className="pt-3 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 bg-stone-50/70 border border-stone-200/80 flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-mono font-bold text-stone-900 uppercase tracking-wider">24H Dispatch</div>
              <div className="text-[11px] text-stone-500 font-sans mt-0.5">Ships from Muzaffarpur</div>
            </div>
          </div>
          <div className="p-3 bg-stone-50/70 border border-stone-200/80 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-mono font-bold text-stone-900 uppercase tracking-wider">Certified Material</div>
              <div className="text-[11px] text-stone-500 font-sans mt-0.5">COA + IFRA available</div>
            </div>
          </div>
          <div className="p-3 bg-stone-50/70 border border-stone-200/80 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-mono font-bold text-stone-900 uppercase tracking-wider">Secure Payment</div>
              <div className="text-[11px] text-stone-500 font-sans mt-0.5">Protected by Razorpay</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      {showStickyBar && (
        <div 
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-3 z-40 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" 
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-stone-400 font-mono">Qty: {quantity} &bull; Total</span>
            <span className="text-base font-mono font-medium text-stone-900">₹{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => handleAction('cart')}
              disabled={isProcessing}
              className="bg-stone-900 text-stone-50 px-5 py-3 text-xs uppercase tracking-widest font-mono flex items-center justify-center min-h-[44px]"
            >
              {isAddedSuccess ? "Added ✓" : "Add to Cart"}
            </button>
            <button 
              onClick={() => handleAction('buy_now')}
              disabled={isProcessing}
              className="bg-brand-orange text-stone-50 px-5 py-3 text-xs uppercase tracking-widest font-mono flex items-center justify-center min-h-[44px]"
            >
              {isBuyingNow ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy Now"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
