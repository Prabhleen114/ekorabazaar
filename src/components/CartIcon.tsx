'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { getGuestCart } from '@/lib/guest-cart'

export default function CartIcon() {
  const [count, setCount] = useState(0)
  const [isBumping, setIsBumping] = useState(false)
  const prevCount = useRef(0)

  const fetchCartCount = async () => {
    try {
      const res = await fetch('/api/cart')
      let newCount = 0
      if (res.status === 401 || res.status === 403) {
        const guestItems = getGuestCart()
        newCount = guestItems.reduce((acc, item) => acc + item.quantity, 0)
      } else if (res.ok) {
        const data = await res.json()
        newCount = (data.items || []).reduce((acc: number, item: any) => acc + item.quantity, 0)
      }
      
      setCount(newCount)
      if (newCount > prevCount.current) {
        setIsBumping(true)
        setTimeout(() => setIsBumping(false), 600)
      }
      prevCount.current = newCount
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchCartCount()
    
    // Listen for custom event from guest-cart.ts or authenticated components
    const handleCartUpdate = () => {
      setIsBumping(true)
      fetchCartCount()
      setTimeout(() => setIsBumping(false), 600)
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
      className={`relative p-2 text-brand-charcoal hover:text-brand-orange transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded-full ${
        isBumping ? 'scale-115 text-brand-orange' : 'scale-100'
      }`}
    >
      <ShoppingBag className={`w-6 h-6 transition-transform ${isBumping ? 'rotate-6' : ''}`} />
      {count > 0 && (
        <span className={`absolute top-0 right-0 bg-brand-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center translate-x-1 -translate-y-1 shadow-sm transition-transform duration-300 ${
          isBumping ? 'scale-135 animate-bounce' : 'scale-100'
        }`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
