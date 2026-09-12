'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { getGuestCart } from '@/lib/guest-cart'

export default function CartIcon() {
  const [count, setCount] = useState(0)
  const fetchCartCount = async () => {
    try {
      const res = await fetch('/api/cart')
      if (res.status === 401 || res.status === 403) {
        const guestItems = getGuestCart()
        const guestCount = guestItems.reduce((acc, item) => acc + item.quantity, 0)
        setCount(guestCount)
        return
      }
      
      if (res.ok) {
        const data = await res.json()
        const serverCount = (data.items || []).reduce((acc: number, item: any) => acc + item.quantity, 0)
        setCount(serverCount)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchCartCount()
    
    // Listen for custom event from guest-cart.ts or authenticated components
    const handleCartUpdate = () => {
      fetchCartCount()
    }
    
    // Listen for storage changes in other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ekora_guest_cart') {
        fetchCartCount()
      }
    }
    
    window.addEventListener('cart-updated', handleCartUpdate)
    window.addEventListener('storage', handleStorage)
    
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return (
    <Link 
      href="/cart" 
      aria-label="Shopping cart"
      className="relative p-2 text-brand-charcoal hover:text-brand-orange transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded-full"
    >
      <ShoppingBag className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center translate-x-1 -translate-y-1 shadow-sm">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
