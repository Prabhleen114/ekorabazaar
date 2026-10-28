"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { getGuestCart, saveGuestCart, updateGuestCartItemQty, removeGuestCartItem, notifyCartUpdated } from "@/lib/guest-cart";
import StockReservationTimer from "@/components/StockReservationTimer";
import WhatsAppCheckoutAssistant from "@/components/WhatsAppCheckoutAssistant";

interface CartDrawerItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
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

  const loadCartData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      if (res.status === 401 || res.status === 403) {
        // Guest cart
        const guest = getGuestCart();
        setItems(
          guest.map((g, idx) => ({
            id: g.productId + "-" + idx,
            productId: g.productId,
            title: g.title || "Wholesale Item",
            price: g.basePrice || 0,
            quantity: g.quantity,
            image: g.imageUrl || "/placeholder-product.svg",
          }))
        );
      } else if (res.ok) {
        const data = await res.json();
        const serverItems = (data.items || []).map((item: any) => ({
          id: item.id,
          productId: item.productId || item.product?.id,
          title: item.product?.title || item.title || "Wholesale Item",
          price: item.effectivePrice ? item.effectivePrice / 100 : item.price,
          quantity: item.quantity,
          image: item.product?.imageUrl || item.image || "/placeholder-product.svg",
        }));
        setItems(serverItems);
      }
    } catch (e) {
      console.error("Error loading cart drawer items", e);
    } finally {
      setLoading(false);
    }
  };

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
  }, []);

  const handleUpdateQty = async (productId: string, newQty: number) => {
    if (newQty <= 0) {
      // Remove
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

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingCharge = 90;

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
            className="absolute inset-0 bg-stone-950/50 backdrop-blur-xs"
          />

          {/* Drawer: Bottom sheet on mobile (< md), Slide-over on laptop (>= md) */}
          <div className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 max-w-full md:max-w-md w-full flex">
            <motion.div
              initial={{ y: "100%", x: 0 }}
              animate={{ y: 0, x: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="w-full bg-white max-h-[85vh] md:max-h-full h-full flex flex-col rounded-t-3xl md:rounded-none shadow-2xl overflow-hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              {/* Mobile Drag Pill */}
              <div className="md:hidden pt-3 pb-1 flex justify-center">
                <div className="w-10 h-1 bg-stone-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-stone-900" />
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Your Cart ({totalCount})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-stone-400 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100"
                  aria-label="Close cart drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stock Reservation Timer */}
              {items.length > 0 && (
                <div className="px-4 pt-3 pb-1 shrink-0 bg-white">
                  <StockReservationTimer variant="compact" />
                </div>
              )}

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 divide-y divide-stone-100">
                {loading && items.length === 0 ? (
                  <div className="py-12 text-center text-xs font-sans text-stone-500">
                    Loading items...
                  </div>
                ) : items.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
                    <p className="text-sm font-sans font-medium text-stone-700">Your cart is empty</p>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="text-xs uppercase tracking-wider font-semibold text-amber-700 hover:underline"
                    >
                      Continue Browsing &rarr;
                    </button>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="py-3.5 flex gap-3.5 items-center">
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
                          ₹{item.price.toLocaleString()} / unit
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-stone-300 rounded h-7 bg-white">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                              className="w-7 h-full flex items-center justify-center text-stone-600 hover:bg-stone-100"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-sans font-bold text-stone-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                              className="w-7 h-full flex items-center justify-center text-stone-600 hover:bg-stone-100"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-sans font-bold text-stone-900">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Footer & Checkout CTA */}
              {items.length > 0 && (
                <div className="p-4 border-t border-stone-200 bg-stone-50 shrink-0 space-y-3">
                  <div className="space-y-1 text-xs font-sans">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-stone-900">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-stone-500" /> Standard Flat Shipping
                      </span>
                      <span className="font-semibold text-stone-900">₹{shippingCharge}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-stone-950 pt-1.5 border-t border-stone-200">
                      <span>Estimated Total</span>
                      <span>₹{(subtotal + shippingCharge).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 1-Tap WhatsApp Checkout Assistant */}
                  <WhatsAppCheckoutAssistant
                    itemCount={totalCount}
                    totalAmount={subtotal + shippingCharge}
                    location="mini_cart"
                    variant="compact"
                  />

                  {/* Trust indicator */}
                  <div className="text-[10px] text-stone-500 font-sans flex items-center justify-center gap-1.5 pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>UPI First &bull; 100% Prepaid Dispatch &bull; No COD</span>
                  </div>

                  {/* Primary Checkout Button in Thumb Zone */}
                  <Link
                    href="/checkout"
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-stone-900 hover:bg-black text-white font-sans font-semibold text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors min-h-[48px]"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
