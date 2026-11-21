"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  ChevronDown,
  Gift,
  Check,
  Sparkles,
} from "lucide-react";
import {
  getGuestCart,
  saveGuestCart,
  addGuestCartItem,
  updateGuestCartItemQty,
  removeGuestCartItem,
  notifyCartUpdated,
} from "@/lib/guest-cart";
import StockReservationTimer from "@/components/StockReservationTimer";
import WhatsAppCheckoutAssistant from "@/components/WhatsAppCheckoutAssistant";
import TierProgressBar from "@/components/checkout/TierProgressBar";
import RecommendationShelf from "@/components/checkout/RecommendationShelf";
import EkoraPointsBanner from "@/components/checkout/EkoraPointsBanner";
import { PricingQuote } from "@/lib/pricing/pricing-engine";

interface CartDrawerItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  isGift?: boolean;
}

export function openMiniCart() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-mini-cart"));
  }
}

export default function MiniCartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartDrawerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [showSavingsDetail, setShowSavingsDetail] = useState(false);

  // Load quote from server given current cart items
  const syncQuote = useCallback(
    async (currentItems: CartDrawerItem[], coupon?: string | null, pts?: number) => {
      if (currentItems.length === 0) {
        setQuote(null);
        return;
      }

      try {
        const res = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: currentItems.map((item) => ({
              productId: item.productId,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              isGift: item.isGift,
            })),
            couponCode: coupon || undefined,
            pointsRequested: pts || 0,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.quote) {
            setQuote(data.quote);
          }
        }
      } catch (err) {
        console.error("Failed to sync cart quote:", err);
      }
    },
    []
  );

  const loadCartData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      let currentItems: CartDrawerItem[] = [];

      if (res.status === 401 || res.status === 403) {
        // Guest cart
        const guest = getGuestCart();
        currentItems = guest.map((g, idx) => ({
          id: g.productId + "-" + idx,
          productId: g.productId,
          title: g.title || "Wholesale Item",
          price: g.basePrice || 0,
          quantity: g.quantity,
          image: g.imageUrl || "/placeholder-product.svg",
        }));
      } else if (res.ok) {
        const data = await res.json();
        currentItems = (data.items || []).map((item: any) => ({
          id: item.id,
          productId: item.productId || item.product?.id,
          title: item.product?.title || item.title || "Wholesale Item",
          price: item.effectivePrice ? item.effectivePrice / 100 : item.price,
          quantity: item.quantity,
          image: item.product?.imageUrl || item.image || "/placeholder-product.svg",
        }));
      }

      setItems(currentItems);

      // Load saved coupon if exists
      let savedCoupon: string | null = null;
      if (typeof window !== "undefined") {
        try {
          const raw = sessionStorage.getItem("ekora_applied_coupon");
          if (raw) {
            const parsed = JSON.parse(raw);
            savedCoupon = parsed.code || null;
            setAppliedCouponCode(savedCoupon);
          }
        } catch (_) {}
      }

      await syncQuote(currentItems, savedCoupon, pointsRedeemed);
    } catch (e) {
      console.error("Error loading cart drawer items", e);
    } finally {
      setLoading(false);
    }
  }, [pointsRedeemed, syncQuote]);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      loadCartData();
    };

    const handleCartUpdate = () => {
      loadCartData();
    };

    window.addEventListener("open-mini-cart", handleOpen);
    window.addEventListener("cart-updated", handleCartUpdate);

    return () => {
      window.removeEventListener("open-mini-cart", handleOpen);
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, [loadCartData]);

  const handleUpdateQty = async (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeGuestCartItem(productId);
      try {
        await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, { method: "DELETE" });
      } catch (_) {}
    } else {
      updateGuestCartItemQty(productId, newQty);
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity: newQty, update: true }),
        });
      } catch (_) {}
    }
    notifyCartUpdated();
    loadCartData();
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setCouponError("");
    const code = couponCodeInput.trim().toUpperCase();

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          subtotalPaise: Math.round((quote?.eligibleSubtotal || 0) * 100),
        }),
      });

      const data = await res.json();
      if (data.valid && data.coupon) {
        setAppliedCouponCode(code);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("ekora_applied_coupon", JSON.stringify(data.coupon));
        }
        setCouponCodeInput("");
        syncQuote(items, code, pointsRedeemed);
      } else {
        setCouponError(data.error || "Invalid coupon code.");
      }
    } catch (_) {
      setCouponError("Failed to validate coupon.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode(null);
    setCouponError("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("ekora_applied_coupon");
    }
    syncQuote(items, null, pointsRedeemed);
  };

  const handleAddRecommendation = async (rec: { id: string; title: string; price: number; image?: string }) => {
    // 1-Tap add to cart
    addGuestCartItem({
      productId: rec.id,
      quantity: 1,
      title: rec.title,
      basePrice: rec.price,
      imageUrl: rec.image,
    });

    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: rec.id, quantity: 1 }),
      });
    } catch (_) {}

    notifyCartUpdated();
    loadCartData();
  };

  const handleTogglePoints = (redeem: boolean) => {
    const pts = redeem ? Math.min(quote?.points?.availableBalance || 0, 500) : 0;
    setPointsRedeemed(pts);
    syncQuote(items, appliedCouponCode, pts);
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartProductIds = items.map((i) => i.productId);
  const gapToNext = quote?.progress?.next?.gap || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs"
          />

          {/* Drawer: Bottom sheet on mobile (< md), Slide-over on desktop (>= md) */}
          <div className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 max-w-full md:max-w-md w-full flex">
            <motion.div
              initial={{ y: "100%", x: 0 }}
              animate={{ y: 0, x: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="w-full bg-stone-50 max-h-[92vh] md:max-h-full h-full flex flex-col rounded-t-3xl md:rounded-none shadow-2xl overflow-hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              {/* Mobile Drag Pill */}
              <div className="md:hidden pt-2.5 pb-1 flex justify-center bg-white shrink-0">
                <div className="w-10 h-1 bg-stone-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-red-900" />
                  <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 uppercase tracking-wide">
                    Your Cart ({totalCount})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100"
                  aria-label="Close cart drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-3 sm:p-4 space-y-4">
                {/* Mandatory Tier Progress Bar */}
                <TierProgressBar progress={quote?.progress} className="shadow-xs" />

                {/* Stock Reservation Timer */}
                {items.length > 0 && <StockReservationTimer variant="compact" />}

                {/* Cart Items List */}
                <div className="bg-white rounded-xl border border-stone-200 p-3 space-y-3">
                  {loading && items.length === 0 ? (
                    <div className="py-12 text-center text-xs font-sans text-stone-500">
                      Loading your cart...
                    </div>
                  ) : items.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
                      <p className="text-sm font-sans font-medium text-stone-700">Your cart is empty</p>
                      <p className="text-xs text-stone-500">Add products below to reach ₹5,000 and unlock flat 5% off + a Free Gift!</p>
                    </div>
                  ) : (
                    <>
                      {items.map((item) => (
                        <div key={item.id} className="py-2.5 flex gap-3 items-center border-b border-stone-100 last:border-b-0">
                          <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-stone-200 relative">
                            <Image
                              src={item.image || "/placeholder-product.svg"}
                              alt={item.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-sans font-semibold text-stone-900 line-clamp-1">
                              {item.title}
                            </h4>
                            <p className="text-xs font-sans text-stone-500 mt-0.5">
                              ₹{item.price.toLocaleString("en-IN")}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex items-center border border-stone-300 rounded h-6.5 bg-white shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                                  className="w-6 h-full flex items-center justify-center text-stone-600 hover:bg-stone-100"
                                  aria-label="Decrease quantity"
                                >
                                  {item.quantity === 1 ? (
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                  ) : (
                                    <Minus className="w-3 h-3" />
                                  )}
                                </button>
                                <span className="w-7 text-center text-xs font-bold text-stone-900">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                                  className="w-6 h-full flex items-center justify-center text-stone-600 hover:bg-stone-100"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-stone-900">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Free Gift Line Item (Automatic) */}
                      {quote?.gift?.eligible && (
                        <div className="py-2.5 px-3 bg-red-50/70 border border-red-200 rounded-lg flex items-center justify-between gap-3 animate-fade-in">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-red-800 text-white flex items-center justify-center shrink-0">
                              <Gift className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-red-800 text-white rounded">
                                Free Gift
                              </span>
                              <p className="text-xs font-bold text-stone-900 mt-0.5">
                                Milestone Reward: Ekora Special Gift
                              </p>
                              <p className="text-[10px] text-stone-500">Unlocked with your ₹5,000+ order</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-emerald-700">FREE</span>
                            <span className="block text-[10px] text-stone-400 line-through">₹499</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {items.length === 0 && (
                  <RecommendationShelf
                    cartProductIds={[]}
                    gap={5000}
                    onAddItem={handleAddRecommendation}
                  />
                )}

                {items.length > 0 && (
                  <>
                    {/* Coupon Code Section */}
                    <div className="bg-white rounded-xl border border-stone-200 p-3 space-y-2">
                      {appliedCouponCode ? (
                        <div className="flex items-center justify-between py-1 px-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="text-xs font-bold text-emerald-800">
                              Coupon {appliedCouponCode} applied
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-[11px] font-bold text-red-700 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={couponCodeInput}
                              onChange={(e) => setCouponCodeInput(e.target.value)}
                              placeholder="Enter coupon code"
                              className="w-full text-xs font-medium pl-8 pr-2 py-2 rounded-lg border border-stone-300 focus:outline-hidden focus:border-red-800 uppercase"
                            />
                          </div>
                          <button
                            type="submit"
                            className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Apply
                          </button>
                        </form>
                      )}
                      {couponError && (
                        <p className="text-[11px] text-red-600 font-medium pl-1">{couponError}</p>
                      )}
                    </div>

                    {/* Saved with discounts banner */}
                    {quote && quote.totalSavings > 0 && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-red-900">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-red-700" />
                          <span>₹{quote.totalSavings.toLocaleString("en-IN")} Saved with milestone & offers!</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSavingsDetail(!showSavingsDetail)}
                          className="p-1 text-red-800 hover:bg-red-100 rounded"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              showSavingsDetail ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    )}

                    {/* Savings Detail Breakdown */}
                    {showSavingsDetail && quote && quote.totalSavings > 0 && (
                      <div className="bg-white rounded-lg p-2.5 border border-stone-200 text-xs space-y-1">
                        {quote.tierDiscount > 0 && (
                          <div className="flex justify-between text-stone-600">
                            <span>Milestone Tier Discount ({quote.tierRewardDescription})</span>
                            <span className="font-semibold text-red-800">-₹{quote.tierDiscount}</span>
                          </div>
                        )}
                        {quote.couponDiscount > 0 && (
                          <div className="flex justify-between text-stone-600">
                            <span>Coupon Discount ({quote.couponCode})</span>
                            <span className="font-semibold text-emerald-700">-₹{quote.couponDiscount}</span>
                          </div>
                        )}
                        {quote.points.pointsDiscount > 0 && (
                          <div className="flex justify-between text-stone-600">
                            <span>Ekora Points Redeemed</span>
                            <span className="font-semibold text-emerald-700">-₹{quote.points.pointsDiscount}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ekora Points Wallet Banner */}
                    <EkoraPointsBanner
                      pointsEarned={quote?.points?.pointsEarned || 0}
                      availableBalance={quote?.points?.availableBalance || 0}
                      pointsRedeemed={quote?.points?.pointsRedeemed || 0}
                      onToggleRedeem={handleTogglePoints}
                    />

                    {/* Recommendation Shelf (Best offers & You might also like) */}
                    <RecommendationShelf
                      cartProductIds={cartProductIds}
                      gap={gapToNext}
                      onAddItem={handleAddRecommendation}
                    />
                  </>
                )}
              </div>

              {/* Bottom Sticky Footer */}
              {items.length > 0 && (
                <div className="border-t border-stone-200 bg-white shrink-0 p-4 space-y-3 shadow-lg">
                  {/* Social Proof Banner */}
                  <div className="bg-red-900 text-white text-[10px] font-bold py-1 px-3 text-center rounded-md tracking-wider uppercase">
                    100% Prepaid Dispatch &bull; Fast Doorstep Delivery
                  </div>

                  {/* Totals Breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-500">
                      <span>Eligible Subtotal</span>
                      <span className="font-semibold text-stone-900">
                        ₹{(quote?.eligibleSubtotal || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {quote && quote.tierDiscount > 0 && (
                      <div className="flex justify-between text-red-800 font-semibold">
                        <span>Milestone Discount</span>
                        <span>-₹{quote.tierDiscount.toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    {quote && quote.couponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Coupon Discount</span>
                        <span>-₹{quote.couponDiscount.toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    {quote && quote.points.pointsDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Points Redeemed</span>
                        <span>-₹{quote.points.pointsDiscount.toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-stone-500">
                      <span>Delivery</span>
                      <span className="font-semibold text-stone-900">
                        ₹{(quote?.shipping || 90).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-stone-200">
                      <div>
                        <span className="text-xs font-bold text-stone-700 block">Estimated total</span>
                        {quote && quote.totalSavings > 0 && (
                          <span className="text-[11px] font-bold text-emerald-600 block">
                            You saved ₹{quote.totalSavings.toLocaleString("en-IN")}!
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        {quote && quote.totalSavings > 0 && (
                          <span className="text-xs text-stone-400 line-through mr-1.5">
                            ₹{((quote.eligibleSubtotal || 0) + (quote.shipping || 90)).toLocaleString("en-IN")}
                          </span>
                        )}
                        <span className="text-lg font-black text-stone-950">
                          ₹{(quote?.grandTotal || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Red Checkout Button (Matching Reference Image) */}
                  <Link
                    href="/checkout"
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-red-900 hover:bg-red-950 text-white font-sans font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-between shadow-md transition-all active:scale-[0.99] min-h-[50px]"
                  >
                    <span className="text-base tracking-wide">Checkout</span>
                    <div className="flex items-center gap-1.5 opacity-90">
                      <span className="text-[10px] font-medium bg-red-950/60 px-2 py-0.5 rounded text-red-100">
                        Prepaid (UPI / Cards)
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>

                  {/* 1-Tap WhatsApp Checkout Assistant */}
                  <WhatsAppCheckoutAssistant
                    itemCount={totalCount}
                    totalAmount={quote?.grandTotal || 0}
                    location="mini_cart"
                    variant="compact"
                  />

                  {/* Powered by Caption */}
                  <div className="text-center">
                    <p className="text-[10px] text-stone-400">
                      Powered by <span className="font-bold text-stone-600">Ekora Commerce</span>
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
