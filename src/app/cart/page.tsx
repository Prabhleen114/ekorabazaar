'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProductImageClient from "@/components/ProductImageClient"
import { Minus, Plus, Trash2, ShoppingBag, Truck, ShieldCheck } from "lucide-react"
import { TrackViewCart } from "@/components/GA4Tracker"
import { TEMP_FLAT_SHIPPING_CHARGE, calculateItemPrice } from "@/lib/pricing"
import { trackEvent } from '@/lib/tracking'
import StockReservationTimer from "@/components/StockReservationTimer"
import WhatsAppCheckoutAssistant from "@/components/WhatsAppCheckoutAssistant"
import CouponSection, { AppliedCoupon } from "@/components/CouponSection"

export default function CartPage() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const router = useRouter()

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
        body: JSON.stringify({ code: appliedCoupon.code, subtotalPaise: total })
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
          } else {
            // Cart total no longer qualifies for this coupon
            setAppliedCoupon(null)
            sessionStorage.removeItem('ekora_applied_coupon')
          }
        })
        .catch(() => {})
    }
  }, [total])

  const handleApplyCoupon = (coupon: AppliedCoupon) => {
    setAppliedCoupon(coupon)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ekora_applied_coupon', JSON.stringify(coupon))
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ekora_applied_coupon')
    }
  }

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
  }, [])

  const fetchCart = async () => {
    try {
      let res = await fetch('/api/cart', { cache: 'no-store' })
      if (res.status === 401 || res.status === 403) {
        setIsGuest(true)
        const { getGuestCart } = await import('@/lib/guest-cart')
        const guestItems = getGuestCart()

        if (guestItems.length === 0) {
          setItems([])
          setTotal(0)
          return
        }

        const guestRes = await fetch('/api/cart/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: guestItems })
        })
        const guestData = await guestRes.json()
        setItems(guestData.items || [])
        const gTotal = guestData.totalAmount || 0
        setTotal(gTotal)
        if (gTotal > 0 && gTotal < 200000) {
          trackEvent("shipping_threshold_view", {
            cart_value: gTotal / 100,
            amount_to_free_shipping: (200000 - gTotal) / 100,
            threshold: 2000,
          })
        }
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
           const finalRes = await fetch('/api/cart', { cache: 'no-store' })
           if (finalRes.ok) {
             res = finalRes
           }
        }
      }

      const data = await res.json()
      setItems(data.items || [])
      const cTotal = data.totalAmount || 0
      setTotal(cTotal)
      if (cTotal > 0 && cTotal < 200000) {
        trackEvent("shipping_threshold_view", {
          cart_value: cTotal / 100,
          amount_to_free_shipping: (200000 - cTotal) / 100,
          threshold: 2000,
        })
      }
    } catch (err) {
      console.error(err)
      // DO NOT clear cart on error
    } finally {
      setLoading(false)
    }
  }

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
    // Instant optimistic UI update
    setItems(prevItems => {
      const updated = prevItems.filter(i => i.id !== itemId && i.productId !== productId)
      const newTotal = updated.reduce((sum, item) => {
        if (item.isAvailable !== false) {
          return sum + (item.effectivePrice * item.quantity)
        }
        return sum
      }, 0)
      setTotal(newTotal)
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

  if (loading) return <div className="min-h-screen p-8 text-center">Loading cart...</div>

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      {/* Brand Header with Home Link */}
      <div className="flex items-center justify-between pb-5 mb-8 border-b border-stone-200">
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
      <h1 className="text-3xl font-bold font-serif mb-8 flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-brand-orange" />
        Your Cart
      </h1>
      <TrackViewCart items={items} value={(total / 100) + TEMP_FLAT_SHIPPING_CHARGE} />

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-brand-linen shadow-sm">
          <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-brand-charcoal/30" />
          </div>
          <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
          <p className="text-brand-charcoal/60 mb-6">Looks like you haven't added anything yet.</p>
          <Link href="/shop" className="bg-brand-charcoal text-white px-4 md:px-6 py-3 rounded-xl hover:bg-brand-charcoal/90 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <StockReservationTimer variant="banner" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => {
              const effectivePaise = typeof item.effectivePrice === 'number' && !isNaN(item.effectivePrice)
                ? item.effectivePrice
                : (item.product?.price || 0);
              const qty = Math.max(1, item.quantity || 1);
              const lineTotalPaise = effectivePaise * qty;
              const unitPriceRupees = effectivePaise / 100;
              const lineTotalRupees = lineTotalPaise / 100;

              const formatRupees = (amt: number) => {
                return amt % 1 === 0
                  ? amt.toLocaleString('en-IN')
                  : amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              };

              return (
                <div key={item.id} className="bg-white p-3.5 sm:p-4 rounded-2xl border border-brand-linen shadow-sm flex gap-3 sm:gap-4 items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-brand-bg relative shrink-0">
                    {item.product.imageUrl ? (
                      <ProductImageClient
                        src={item.product.imageUrl}
                        alt={item.product.title}
                        sizes="80px"
                        quality={80}
                        className="object-contain p-1"
                        fallbackSrc="/og-image.jpg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.productId}`} className="font-semibold hover:text-brand-orange transition-colors text-sm sm:text-base line-clamp-2 break-words">
                      {item.product.title}
                    </Link>
                    <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-brand-orange font-bold text-base sm:text-lg">
                        ₹{formatRupees(lineTotalRupees)}
                      </span>
                      <span className="text-stone-500 text-xs font-normal">
                        ₹{formatRupees(unitPriceRupees)} per unit
                      </span>
                    </div>
                    {!item.isAvailable && <p className="text-red-500 text-xs font-semibold mt-1">Currently unavailable</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center bg-brand-bg rounded-lg border border-brand-linen">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.productId)} className="p-1.5 sm:p-2 hover:bg-brand-linen/50 rounded-l-lg" disabled={!item.isAvailable} aria-label="Decrease quantity">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 sm:w-8 text-center text-xs sm:text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.productId)} className="p-1.5 sm:p-2 hover:bg-brand-linen/50 rounded-r-lg" disabled={!item.isAvailable} aria-label="Increase quantity">
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
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-brand-linen shadow-sm h-fit lg:sticky lg:top-24 w-full overflow-hidden">
            <h2 className="text-lg font-bold mb-4 text-brand-charcoal">Order Summary</h2>

            {/* Coupon Section */}
            <div className="mb-4 pb-4 border-b border-brand-linen">
              <CouponSection
                subtotalPaise={total}
                appliedCoupon={appliedCoupon}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
              />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-brand-charcoal/70">Subtotal</span>
                <span className="font-semibold">₹{(total / 100).toLocaleString('en-IN')}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-sm text-emerald-700 font-semibold">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>-₹{appliedCoupon.discountAmountRupees.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-brand-charcoal/70">Delivery</span>
                <span className="font-semibold">₹{TEMP_FLAT_SHIPPING_CHARGE.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="border-t border-brand-linen pt-3.5 flex justify-between mb-4 text-lg">
              <span className="font-bold text-brand-charcoal">Total</span>
              <span className="font-bold text-brand-charcoal">
                ₹{Math.max(0, (total / 100) - (appliedCoupon?.discountAmountRupees || 0) + TEMP_FLAT_SHIPPING_CHARGE).toLocaleString('en-IN')}
              </span>
            </div>

            <Link
              href="/checkout"
              className="w-full block text-center bg-brand-orange hover:bg-brand-terracotta text-white py-3.5 rounded-xl font-semibold transition-all shadow-md"
            >
              Proceed to Checkout
            </Link>

            <div className="mt-5 pt-4 border-t border-brand-linen flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Secure Payments (Razorpay)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                <Truck className="w-4 h-4 text-brand-orange shrink-0" />
                <span>Dispatch within 24 Hours</span>
              </div>
            </div>

            <div className="mt-4">
              <WhatsAppCheckoutAssistant
                itemCount={items.reduce((s, i) => s + (i.quantity || 1), 0)}
                totalAmount={Math.max(0, (total / 100) - (appliedCoupon?.discountAmountRupees || 0) + TEMP_FLAT_SHIPPING_CHARGE)}
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
