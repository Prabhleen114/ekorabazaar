'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProductImageClient from "@/components/ProductImageClient"
import { Minus, Plus, Trash2, ShoppingBag, Truck, ShieldCheck, Gift, Sparkles } from "lucide-react"
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

  if (loading) return <div className="min-h-screen p-8 text-center text-stone-500 font-sans">Loading your cart...</div>

  const cartProductIds = items.map(i => i.productId)
  const gapToNext = quote?.progress?.next?.gap || 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      {/* Brand Header with Home Link */}
      <div className="flex items-center justify-between pb-5 mb-6 border-b border-stone-200">
        <Link href="/" className="inline-flex items-center group" aria-label="Ekora Bazaar Home">
          <Image
            src="/images/rectangle logo ekora bazaar.jpeg"
            alt="Ekora Bazaar"
            width={174}
            height={38}
            priority
            className="object-contain mix-blend-multiply group-hover:opacity-85 transition-opacity"
            style={{ height: "36px", width: "auto" }}
          />
        </Link>
        <Link
          href="/shop"
          className="text-xs uppercase tracking-wider text-stone-600 hover:text-stone-900 transition-colors font-medium flex items-center gap-1.5"
        >
          <span>&larr;</span>
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif flex items-center gap-3 text-stone-900">
          <ShoppingBag className="w-7 h-7 text-red-900" />
          Your Cart ({items.reduce((s, i) => s + (i.quantity || 1), 0)})
        </h1>
        <span className="text-xs font-semibold px-2.5 py-1 bg-red-100 text-red-900 rounded-full">
          100% Prepaid Dispatch
        </span>
      </div>

      <TrackViewCart items={items} value={(total / 100) + TEMP_FLAT_SHIPPING_CHARGE} />

      {/* Mandatory Milestone Progress Bar */}
      <TierProgressBar progress={quote?.progress} className="shadow-xs mb-6" />

      {items.length === 0 ? (
        <div className="space-y-6">
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 shadow-xs">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-8 h-8 text-stone-300" />
            </div>
            <h2 className="text-lg font-bold mb-1 text-stone-900">Your cart is empty</h2>
            <p className="text-stone-500 mb-4 text-xs">Add products below to reach ₹5,000 and unlock a Free Gift + flat 5% off!</p>
            <Link href="/shop" className="bg-red-900 hover:bg-red-950 text-white px-5 py-2.5 rounded-xl transition-colors font-bold text-xs inline-block">
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
        <div className="space-y-6">
          <StockReservationTimer variant="banner" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => {
                const unitPriceRupees = typeof item.effectivePrice === 'number' && !isNaN(item.effectivePrice)
                  ? item.effectivePrice
                  : calculateItemPrice(item.product, item.quantity || 1);
                const qty = Math.max(1, item.quantity || 1);
                const lineTotalRupees = unitPriceRupees * qty;

                const formatRupees = (amt: number) => {
                  return amt % 1 === 0
                    ? amt.toLocaleString('en-IN')
                    : amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                };

                return (
                  <div key={item.id} className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs flex gap-3 sm:gap-4 items-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-50 relative shrink-0 border border-stone-100">
                      {item.product?.imageUrl ? (
                        <ProductImageClient
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          sizes="80px"
                          quality={80}
                          className="object-contain p-1"
                          fallbackSrc="/og-image.jpg"
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.productId}`} className="font-semibold hover:text-red-900 transition-colors text-sm sm:text-base line-clamp-2 break-words text-stone-900">
                        {item.product?.title || item.title}
                      </Link>
                      <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-stone-950 font-bold text-base sm:text-lg">
                          ₹{formatRupees(lineTotalRupees)}
                        </span>
                        <span className="text-stone-500 text-xs font-normal">
                          ₹{formatRupees(unitPriceRupees)} per unit
                        </span>
                      </div>
                      {!item.isAvailable && <p className="text-red-500 text-xs font-semibold mt-1">Currently unavailable</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center bg-white rounded-lg border border-stone-300 shadow-2xs">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.productId)} className="p-1.5 sm:p-2 hover:bg-stone-100 rounded-l-lg text-stone-600" disabled={!item.isAvailable} aria-label="Decrease quantity">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 sm:w-8 text-center text-xs sm:text-sm font-bold text-stone-900">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.productId)} className="p-1.5 sm:p-2 hover:bg-stone-100 rounded-r-lg text-stone-600" disabled={!item.isAvailable} aria-label="Increase quantity">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.id, item.productId)} className="text-red-400 hover:text-red-600 p-1" title="Remove item" aria-label="Remove item">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Automatic Free Gift Line Item */}
              {quote?.gift?.eligible && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-800 text-white rounded-xl flex items-center justify-center shrink-0">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 bg-red-800 text-white rounded">
                        Free Gift
                      </span>
                      <h4 className="font-bold text-stone-900 text-sm mt-0.5">
                        Milestone Reward: Ekora Special Gift Item
                      </h4>
                      <p className="text-xs text-stone-500">Automatically unlocked on reaching ₹5,000 threshold</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-emerald-700">FREE</span>
                    <span className="block text-xs text-stone-400 line-through">₹499</span>
                  </div>
                </div>
              )}

              {/* Recommendations Shelf */}
              <div className="pt-4">
                <RecommendationShelf
                  cartProductIds={cartProductIds}
                  gap={gapToNext}
                  onAddItem={handleAddRecommendation}
                />
              </div>
            </div>

            {/* Right Order Summary Column */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm h-fit lg:sticky lg:top-24 w-full space-y-4">
              <h2 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">Order Summary</h2>

              {/* Ekora Points Cashback / Wallet Banner */}
              <EkoraPointsBanner
                pointsEarned={quote?.points?.pointsEarned || 0}
                availableBalance={quote?.points?.availableBalance || 0}
              />

              {/* Coupon Section */}
              <div className="py-2 border-b border-stone-100">
                <CouponSection
                  subtotalPaise={Math.round((quote?.eligibleSubtotal || total) * 100)}
                  appliedCoupon={appliedCoupon}
                  onApply={handleApplyCoupon}
                  onRemove={handleRemoveCoupon}
                />
              </div>

              {/* Itemized Breakdown */}
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Eligible Subtotal</span>
                  <span className="font-semibold text-stone-900">
                    ₹{(quote?.eligibleSubtotal || total).toLocaleString('en-IN')}
                  </span>
                </div>

                {quote && quote.tierDiscount > 0 && (
                  <div className="flex justify-between text-red-800 font-semibold">
                    <span>Milestone Discount ({quote.tierRewardDescription})</span>
                    <span>-₹{quote.tierDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {quote && quote.couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount ({quote.couponCode})</span>
                    <span>-₹{quote.couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {quote && quote.points.pointsDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Ekora Points Redeemed</span>
                    <span>-₹{quote.points.pointsDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600">
                  <span>Standard Flat Shipping</span>
                  <span className="font-semibold text-stone-900">
                    ₹{(quote?.shipping || TEMP_FLAT_SHIPPING_CHARGE).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Total & Savings */}
              <div className="border-t border-stone-200 pt-3">
                {quote && quote.totalSavings > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-600 mb-1">
                    <span>Total Savings</span>
                    <span>₹{quote.totalSavings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-lg font-bold text-stone-950">
                  <span>Grand Total</span>
                  <span>₹{(quote?.grandTotal || (total + TEMP_FLAT_SHIPPING_CHARGE)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Primary Checkout Button */}
              <Link
                href="/checkout"
                className="w-full block text-center bg-red-900 hover:bg-red-950 text-white py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-[0.99]"
              >
                Proceed to Checkout &rarr;
              </Link>

              {/* Trust Badges */}
              <div className="pt-2 flex flex-col gap-2 text-xs text-stone-500 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Prepaid Dispatch &bull; No COD</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-red-800 shrink-0" />
                  <span>Doorstep Delivery via Surface / Air</span>
                </div>
              </div>

              <div className="pt-2">
                <WhatsAppCheckoutAssistant
                  itemCount={items.reduce((s, i) => s + (i.quantity || 1), 0)}
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
