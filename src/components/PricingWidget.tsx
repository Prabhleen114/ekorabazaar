"use client";
import { useState, useEffect, useRef } from "react";
import { Minus, Plus, ShoppingCart, Loader2, Check, MessageCircle } from "lucide-react";
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
  const hasTrackedTierView = useRef(false);

  const router = useRouter();

  // Active tiers and price derived from selectedVariant if present
  const activeTiers = (selectedVariant && selectedVariant.tiers && selectedVariant.tiers.length > 0)
    ? selectedVariant.tiers
    : tiers;
  const activeBasePrice = selectedVariant
    ? selectedVariant.price
    : (basePrice ?? (tiers.length > 0 ? tiers[0].price : 0));

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
            className="w-full bg-brand-charcoal hover:bg-brand-charcoal/90 text-white py-3.5 px-6 rounded-xl font-semibold transition-all shadow-md flex items-center justify-center gap-2.5 text-center"
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
      <div className="bg-brand-bg rounded-2xl p-6 border border-brand-linen mt-8">
        {variants && variants.length > 0 && (
          <div className="mb-6 pb-6 border-b border-brand-linen">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/70">
                Choose Your Quantity
              </label>
              <span className="text-xs font-semibold text-brand-orange">
                Selected: {selectedVariant?.size}
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
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
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-brand-charcoal text-white border-brand-charcoal shadow-sm"
                        : "bg-white text-brand-charcoal/80 border-brand-linen hover:border-brand-charcoal/40 hover:bg-stone-50"
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <h3 className="font-bold text-brand-charcoal mb-4">Wholesale Pricing Tiers</h3>
        
        <div className="space-y-2 mb-6">
          {activeTiers.map((tier, idx) => {
          const isActive = currentTier === tier;
          return (
            <div 
              key={idx} 
              onMouseEnter={() => trackEvent("tier_pricing_hover", {
                productId,
                productName,
                tierMinQty: tier.minQty,
                tierMaxQty: tier.maxQty,
                price: tier.price,
                discountPct: tier.discountPct,
              })}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                isActive ? "bg-white border-brand-orange shadow-sm" : "border-transparent text-brand-charcoal/60 hover:bg-white/60"
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
              onClick={() => handleQuantityChange(quantity - 1)}
              className="w-12 h-full flex items-center justify-center text-brand-charcoal/50 hover:bg-brand-linen/50 hover:text-brand-charcoal transition-colors min-w-[44px]"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input 
              type="number" 
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || moq)}
              className="flex-1 w-full text-center font-semibold text-brand-charcoal focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button 
              onClick={() => handleQuantityChange(quantity + 1)}
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
