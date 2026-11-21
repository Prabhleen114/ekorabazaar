'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProductImageClient from "@/components/ProductImageClient"
import { Minus, Plus, Trash2, ShoppingBag, Truck, ShieldCheck, Gift } from "lucide-react"
import { TrackViewCart } from "@/components/GA4Tracker"
import { TEMP_FLAT_SHIPPING_CHARGE, calculateItemPrice } from "@/lib/pricing"
import { trackEvent } from '@/lib/tracking'
import StockReservationTimer from "@/components/StockReservationTimer"
import WhatsAppCheckoutAssistant from "@/components/WhatsAppCheckoutAssistant"
import CouponSection, { AppliedCoupon } from "@/components/CouponSection"
import TierProgressBar from "@/components/checkout/TierProgressBar"
import RecommendationShelf from "@/components/checkout/RecommendationShelf"
import EkoraPointsBanner from "@/components/checkout/EkoraPointsBanner"
import { PricingQuote } from "@/lib/pricing/pricing-engine"

export default function CartPage() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [quote, setQuote] = useState<PricingQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const router = useRouter()

  const syncQuote = useCallback(async (currentItems: any[], couponCode?: string) => {
    if (currentItems.length === 0) {
      setQuote(null)
      return
    }

    try {
      const res = await fetch('/api/checkout/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: currentItems.map(item => ({
            productId: item.productId,
            title: item.product?.title || item.title,
            price: item.effectivePrice,
            quantity: item.quantity,
          })),
          couponCode,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.quote) {
          setQuote(data.quote)
        }
      }
    } catch (err) {
      console.error('Failed to sync pricing quote:', err)
    }
  }, [])

  // Load saved coupon on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('ekora_applied_coupon')
        if (saved) {
          setAppliedCoupon(JSON.parse(saved))
        }
      } catch (e) {}
    }
  }, [])

  // Re-validate coupon when total changes
  useEffect(() => {
    if (appliedCoupon && total > 0) {
      fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: appliedCoupon.code, subtotalPaise: Math.round(total * 100) })
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid && data.coupon) {
            const updated: AppliedCoupon = {
              code: data.coupon.code,
              discountAmountPaise: data.coupon.discountAmountPaise,
              discountAmountRupees: data.coupon.discountAmountRupees,
              description: data.coupon.description
            }
            setAppliedCoupon(updated)
            sessionStorage.setItem('ekora_applied_coupon', JSON.stringify(updated))
            syncQuote(items, updated.code)
          } else {
            setAppliedCoupon(null)
            sessionStorage.removeItem('ekora_applied_coupon')
            syncQuote(items, undefined)
          }
        })
        .catch(() => {})
    }
  }, [total, syncQuote, items])

  const handleApplyCoupon = (coupon: AppliedCoupon) => {
    setAppliedCoupon(coupon)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ekora_applied_coupon', JSON.stringify(coupon))
    }
    syncQuote(items, coupon.code)
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ekora_applied_coupon')
    }
    syncQuote(items, undefined)
  }

  const fetchCart = useCallback(async () => {
    try {
      let res = await fetch('/api/cart', { cache: 'no-store' })
      if (res.status === 401 || res.status === 403) {
        setIsGuest(true)
        const { getGuestCart } = await import('@/lib/guest-cart')
        const guestItems = getGuestCart()

        if (guestItems.length === 0) {
          setItems([])
          setTotal(0)
          setQuote(null)
          return
        }

        const guestRes = await fetch('/api/cart/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: guestItems })
        })
        const guestData = await guestRes.json()
        const fetchedItems = guestData.items || []
        setItems(fetchedItems)
        const gTotal = guestData.totalAmount || 0
        setTotal(gTotal)
        syncQuote(fetchedItems, appliedCoupon?.code)
        return
      }

      if (!res.ok) {
        throw new Error('Failed to fetch cart. Please try again later.')
      }

      // Check if there is an unsynced guest cart
      const { getGuestCart, clearGuestCart } = await import('@/lib/guest-cart')
      const guestItems = getGuestCart()
      if (guestItems && guestItems.length > 0) {
        const syncRes = await fetch('/api/cart/sync', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ items: guestItems })
        })
        if (syncRes.ok) {
           clearGuestCart()
           res = await fetch('/api/cart', { cache: 'no-store' })
        }
      }

      const data = await res.json()
      const fetchedItems = data.items || []
      setItems(fetchedItems)
      const cTotal = data.totalAmount || 0
      setTotal(cTotal)
      syncQuote(fetchedItems, appliedCoupon?.code)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [appliedCoupon?.code, syncQuote])

  useEffect(() => {
    fetchCart()

    const handleCartUpdate = () => fetchCart()
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ekora_guest_cart') fetchCart()
    }

    window.addEventListener('cart-updated', handleCartUpdate)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [fetchCart])

  const updateQuantity = async (itemId: string, newQty: number, productId: string) => {
    if (newQty < 1) return
    const currentItem = items.find(i => i.id === itemId || i.productId === productId)
    if (currentItem?.product?.stock && newQty > currentItem.product.stock) return

    trackEvent("quantity_change", {
      productId,
      product_id: productId,
      old_qty: currentItem?.quantity || 1,
      new_qty: newQty,
      source: "cart",
    })

    // Instant optimistic UI update
    setItems(prevItems => {
      const updated = prevItems.map(item => {
        if (item.id === itemId || item.productId === productId) {
          const newEffective = item.product ? calculateItemPrice(item.product, newQty) : item.effectivePrice
          return {
            ...item,
            quantity: newQty,
            effectivePrice: newEffective
          }
        }
        return item
      })
      const newTotal = updated.reduce((sum, item) => {
        if (item.isAvailable !== false) {
          return sum + (item.effectivePrice * item.quantity)
        }
        return sum
      }, 0)
      setTotal(newTotal)
      syncQuote(updated, appliedCoupon?.code)
      return updated
    })

    try {
      if (isGuest) {
        const { updateGuestCartItemQty } = await import('@/lib/guest-cart')
        updateGuestCartItemQty(productId, newQty)
        fetchCart()
      } else {
        await fetch(`/api/cart/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: newQty })
        })
        const { notifyCartUpdated } = await import('@/lib/guest-cart')
        notifyCartUpdated()
        fetchCart()
      }
    } catch (err) {
      console.error(err)
      fetchCart()
    }
  }

  const removeItem = async (itemId: string, productId: string) => {
    setItems(prevItems => {
      const updated = prevItems.filter(i => i.id !== itemId && i.productId !== productId)
      const newTotal = updated.reduce((sum, item) => {
        if (item.isAvailable !== false) {
          return sum + (item.effectivePrice * item.quantity)
        }
        return sum
      }, 0)
      setTotal(newTotal)
      syncQuote(updated, appliedCoupon?.code)
      return updated
    })

    try {
      if (isGuest) {
        const { removeGuestCartItem } = await import('@/lib/guest-cart')
        removeGuestCartItem(productId)
        fetchCart()
      } else {
        await fetch(`/api/cart/${itemId}`, { method: 'DELETE' })
        const { notifyCartUpdated } = await import('@/lib/guest-cart')
        notifyCartUpdated()
        fetchCart()
      }
    } catch (err) {
      console.error(err)
      fetchCart()
    }
  }

  const handleAddRecommendation = async (rec: { id: string; title: string; price: number; image?: string }) => {
    const { addGuestCartItem, notifyCartUpdated } = await import('@/lib/guest-cart')
    addGuestCartItem({
      productId: rec.id,
      quantity: 1,
      title: rec.title,
      basePrice: rec.price,
      imageUrl: rec.image,
    })

    if (!isGuest) {
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: rec.id, quantity: 1 }),
        })
      } catch (_) {}
    }

    notifyCartUpdated()
    fetchCart()
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-stone-500 font-sans text-xs">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-red-900 rounded-full animate-spin mb-2" />
        Loading your cart...
      </div>
    )
  }

  const cartProductIds = items.map(i => i.productId)
  const gapToNext = quote?.progress?.next?.gap || 0
  const itemCount = items.reduce((s, i) => s + (i.quantity || 1), 0)

  const formatRupees = (amt: number) => {
    return amt % 1 === 0
      ? amt.toLocaleString('en-IN')
      : amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200">
        <Link href="/" className="inline-flex items-center group" aria-label="Ekora Bazaar Home">
          <Image
            src="/images/rectangle logo ekora bazaar.jpeg"
            alt="Ekora Bazaar"
            width={140}
            height={30}
            priority
            className="object-contain mix-blend-multiply group-hover:opacity-85 transition-opacity"
            style={{ height: "28px", width: "auto" }}
          />
        </Link>
        <Link
          href="/shop"
          className="text-[11px] uppercase tracking-wider text-stone-600 hover:text-stone-900 transition-colors font-medium flex items-center gap-1"
        >
          <span>&larr;</span>
          <span>Continue Shopping</span>
        </Link>
      </div>

      {/* Page Title & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h1 className="text-lg sm:text-xl font-bold font-serif flex items-center gap-2 text-stone-900">
          <ShoppingBag className="w-5 h-5 text-red-900 shrink-0" />
          <span>Your Cart</span>
          <span className="text-xs font-sans font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full">
            100% Prepaid Dispatch &bull; No COD
          </span>
        </div>
      </div>

      <TrackViewCart items={items} value={(total / 100) + TEMP_FLAT_SHIPPING_CHARGE} />

      {/* Mandatory Milestone Progress Bar */}
      <TierProgressBar progress={quote?.progress} className="mb-4" />

      {items.length === 0 ? (
        <div className="space-y-4">
          <div className="text-center py-10 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <ShoppingBag className="w-6 h-6 text-stone-300" />
            </div>
            <h2 className="text-base font-bold mb-1 text-stone-900">Your cart is empty</h2>
            <p className="text-stone-500 mb-3 text-xs">Add products below to reach ₹5,000 and unlock a Free Gift + flat 5% off!</p>
            <Link href="/shop" className="bg-red-900 hover:bg-red-950 text-white px-4 py-2 rounded-lg transition-colors font-bold text-xs inline-block">
              Explore All Products &rarr;
            </Link>
          </div>

          <RecommendationShelf
            cartProductIds={[]}
            gap={5000}
            onAddItem={handleAddRecommendation}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Left Column: Items List & Recommendations */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-3">
            {/* Item Rows */}
            <div className="space-y-2.5">
              {items.map(item => {
                const unitPriceRupees = typeof item.effectivePrice === 'number' && !isNaN(item.effectivePrice)
                  ? item.effectivePrice
                  : calculateItemPrice(item.product, item.quantity || 1);
                const qty = Math.max(1, item.quantity || 1);
                const lineTotalRupees = unitPriceRupees * qty;

                return (
                  <div
                    key={item.id || item.productId}
                    className="bg-white p-2.5 sm:p-3 rounded-xl border border-stone-200/90 shadow-2xs flex gap-2.5 sm:gap-3 items-center hover:border-stone-300 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-stone-50 relative shrink-0 border border-stone-100">
                      {item.product?.imageUrl ? (
                        <ProductImageClient
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          sizes="64px"
                          quality={80}
                          className="object-contain p-0.5"
                          fallbackSrc="/og-image.jpg"
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-200" />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-medium hover:text-red-900 transition-colors text-xs sm:text-sm line-clamp-1 sm:line-clamp-2 text-stone-900 leading-snug"
                      >
                        {item.product?.title || item.title}
                      </Link>
                      <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-stone-950 font-bold text-xs sm:text-sm">
                          ₹{formatRupees(lineTotalRupees)}
                        </span>
                        <span className="text-stone-400 text-[10px] sm:text-[11px] font-normal">
                          ₹{formatRupees(unitPriceRupees)} / unit
                        </span>
                      </div>
                      {!item.isAvailable && (
                        <p className="text-red-500 text-[11px] font-medium mt-0.5">Currently unavailable</p>
                      )}
                    </div>

                    {/* Quantity Controls & Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-stone-50 rounded-md border border-stone-200 h-7 text-xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.productId)}
                          className="w-6 h-7 flex items-center justify-center hover:bg-stone-200/70 text-stone-600 transition-colors"
                          disabled={!item.isAvailable}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-stone-900 text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.productId)}
                          className="w-6 h-7 flex items-center justify-center hover:bg-stone-200/70 text-stone-600 transition-colors"
                          disabled={!item.isAvailable}
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.productId)}
                        className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Automatic Free Gift Item Line */}
              {quote?.gift?.eligible && (
                <div className="bg-red-50/80 border border-red-200 p-2.5 sm:p-3 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-red-800 text-white rounded-lg flex items-center justify-center shrink-0">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-red-800 text-white rounded">
                        Free Gift
                      </span>
                      <h4 className="font-semibold text-stone-900 text-xs mt-0.5">
                        Milestone Reward: Ekora Special Gift Item
                      </h4>
                      <p className="text-[10px] text-stone-500">Unlocked on reaching ₹5,000 threshold</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-700">FREE</span>
                    <span className="block text-[10px] text-stone-400 line-through">₹499</span>
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations Shelf (Below Item List) */}
            <div className="pt-2">
              <RecommendationShelf
                cartProductIds={cartProductIds}
                gap={gapToNext}
                onAddItem={handleAddRecommendation}
              />
            </div>
          </div>

          {/* Right Column: Timer + Sticky Order Summary */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-3 lg:sticky lg:top-4">
            {/* Compact Timer Widget placed immediately above Order Summary per user instruction */}
            <StockReservationTimer variant="compact" className="shadow-2xs" />

            {/* Order Summary Box */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <h2 className="text-sm sm:text-base font-bold text-stone-900">Order Summary</h2>
                <span className="text-[11px] text-stone-500">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Ekora Points Cashback / Wallet Banner */}
              <EkoraPointsBanner
                pointsEarned={quote?.points?.pointsEarned || 0}
                availableBalance={quote?.points?.availableBalance || 0}
              />

              {/* Coupon Section */}
              <div className="py-1 border-b border-stone-100">
                <CouponSection
                  subtotalPaise={Math.round((quote?.eligibleSubtotal || total) * 100)}
                  appliedCoupon={appliedCoupon}
                  onApply={handleApplyCoupon}
                  onRemove={handleRemoveCoupon}
                />
              </div>

              {/* Itemized Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Eligible Subtotal</span>
                  <span className="font-semibold text-stone-900">
                    ₹{formatRupees(quote?.eligibleSubtotal || total)}
                  </span>
                </div>

                {quote && quote.tierDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Milestone Discount ({quote.tierRewardDescription})</span>
                    <span>-₹{formatRupees(quote.tierDiscount)}</span>
                  </div>
                )}

                {quote && quote.couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount ({quote.couponCode})</span>
                    <span>-₹{formatRupees(quote.couponDiscount)}</span>
                  </div>
                )}

                {quote && quote.points.pointsDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Ekora Points Redeemed</span>
                    <span>-₹{formatRupees(quote.points.pointsDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600">
                  <span>Standard Flat Shipping</span>
                  <span className="font-semibold text-stone-900">
                    ₹{formatRupees(quote?.shipping || TEMP_FLAT_SHIPPING_CHARGE)}
                  </span>
                </div>
              </div>

              {/* Total & Savings */}
              <div className="border-t border-stone-200 pt-2.5">
                {quote && quote.totalSavings > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-600 mb-1">
                    <span>Total Savings</span>
                    <span>₹{formatRupees(quote.totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-base sm:text-lg font-bold text-stone-950">
                  <span>Grand Total</span>
                  <span>₹{formatRupees(quote?.grandTotal || (total + TEMP_FLAT_SHIPPING_CHARGE))}</span>
                </div>
              </div>

              {/* Primary Checkout Button */}
              <Link
                href="/checkout"
                className="w-full block text-center bg-red-900 hover:bg-red-950 text-white py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
              >
                Proceed to Checkout &rarr;
              </Link>

              {/* Trust & Guarantee Badges */}
              <div className="pt-1 flex flex-col gap-1.5 text-[11px] text-stone-500 font-medium border-t border-stone-100">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>100% Prepaid Dispatch &bull; UPI, Cards, NetBanking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-red-800 shrink-0" />
                  <span>Doorstep Factory Dispatch</span>
                </div>
              </div>

              <div className="pt-1">
                <WhatsAppCheckoutAssistant
                  itemCount={itemCount}
                  totalAmount={quote?.grandTotal || (total + TEMP_FLAT_SHIPPING_CHARGE)}
                  location="cart_page"
                  variant="card"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
