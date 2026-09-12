'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BuyerNavbar from '@/components/BuyerNavbar'
import BuyerFooter from '@/components/BuyerFooter'
import { 
  Package, 
  MapPin, 
  User, 
  LogOut, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  Loader2
} from 'lucide-react'

type TabType = 'orders' | 'addresses' | 'profile'

function AccountDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabType) || 'orders'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Address form modal
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    setDefault: true
  })
  const [addressSubmitting, setAddressSubmitting] = useState(false)
  const [addressError, setAddressError] = useState('')

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType
    if (tabParam && ['orders', 'addresses', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  useEffect(() => {
    loadAccountData()
  }, [])

  const loadAccountData = async () => {
    setLoading(true)
    try {
      // 1. Fetch user profile
      const userRes = await fetch('/api/auth/me')
      const userData = await userRes.json()
      if (!userData.user) {
        router.push('/login?redirect=/account')
        return
      }
      setUser(userData.user)

      // 2. Fetch orders
      const ordersRes = await fetch('/api/account/orders')
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(ordersData.orders || [])
      }

      // 3. Fetch addresses
      const addrRes = await fetch('/api/addresses')
      if (addrRes.ok) {
        const addrData = await addrRes.json()
        setAddresses(addrData.addresses || [])
      }
    } catch (err) {
      console.error('Failed to load account data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    router.replace(`/account?tab=${tab}`)
  }

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddressSubmitting(true)
    setAddressError('')
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm)
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save address')
      }
      setShowAddressModal(false)
      setAddressForm({
        name: '',
        phone: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        setDefault: false
      })
      // Refresh addresses
      const addrRes = await fetch('/api/addresses')
      const addrData = await addrRes.json()
      setAddresses(addrData.addresses || [])
    } catch (err: any) {
      setAddressError(err.message)
    } finally {
      setAddressSubmitting(false)
    }
  }

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await fetch(`/api/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true })
      })
      const addrRes = await fetch('/api/addresses')
      const addrData = await addrRes.json()
      setAddresses(addrData.addresses || [])
    } catch (err) {
      console.error('Failed to set default address:', err)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to remove this address?')) return
    try {
      await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
      setAddresses(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Failed to delete address:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col justify-between">
        <BuyerNavbar />
        <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center justify-center flex-1">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin mb-4" />
          <p className="text-sm font-medium text-brand-charcoal/60">Loading account details...</p>
        </div>
        <BuyerFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between">
      <BuyerNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1 w-full">
        {/* Header Title */}
        <div className="mb-8 pb-4 border-b border-brand-linen flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-orange block mb-1">
              Customer Portal
            </span>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-brand-charcoal">
              My Account
            </h1>
          </div>
          <div className="text-xs text-brand-charcoal/60">
            Logged in as <span className="font-semibold text-brand-charcoal">{user?.email}</span>
          </div>
        </div>

        {/* Layout: Sidebar + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-brand-linen p-4 shadow-sm space-y-1.5">
              
              {/* User Overview Mini Banner */}
              <div className="p-3 mb-2 bg-brand-bg rounded-xl border border-brand-linen flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-charcoal text-white flex items-center justify-center font-bold text-base">
                  {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-sm text-brand-charcoal truncate">
                    {user?.displayName || 'Valued Creator'}
                  </p>
                  <p className="text-[11px] text-brand-charcoal/60 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleTabChange('orders')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'orders'
                    ? 'bg-brand-charcoal text-white shadow-sm'
                    : 'text-brand-charcoal/70 hover:bg-brand-bg hover:text-brand-charcoal'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-brand-orange" />
                  My Orders
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-linen/60 font-mono text-brand-charcoal">
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('addresses')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'addresses'
                    ? 'bg-brand-charcoal text-white shadow-sm'
                    : 'text-brand-charcoal/70 hover:bg-brand-bg hover:text-brand-charcoal'
                }`}
              >
                <span className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-brand-orange" />
                  Saved Addresses
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-linen/60 font-mono text-brand-charcoal">
                  {addresses.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('profile')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-brand-charcoal text-white shadow-sm'
                    : 'text-brand-charcoal/70 hover:bg-brand-bg hover:text-brand-charcoal'
                }`}
              >
                <span className="flex items-center gap-3">
                  <User className="w-4 h-4 text-brand-orange" />
                  Personal Details
                </span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              <div className="pt-3 mt-3 border-t border-brand-linen">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>

            </div>
          </aside>

          {/* Right Main Content Area */}
          <section className="lg:col-span-3">

            {/* TAB 1: ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold font-serif text-brand-charcoal">
                      Order History
                    </h2>
                    <p className="text-xs text-brand-charcoal/60 mt-0.5">
                      Review all past purchases, invoices, and fulfillment statuses
                    </p>
                  </div>
                  <Link
                    href="/shop"
                    className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1"
                  >
                    Continue Shopping &rarr;
                  </Link>
                </div>

                {orders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-brand-linen p-12 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center mx-auto mb-4 border border-brand-linen">
                      <Package className="w-8 h-8 text-brand-charcoal/40" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-1">
                      No orders placed yet
                    </h3>
                    <p className="text-sm text-brand-charcoal/60 max-w-md mx-auto mb-6">
                      Explore our studio-grade silicone moulds, wax blends, and craft formulation materials.
                    </p>
                    <Link
                      href="/shop"
                      className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-charcoal text-white text-sm font-semibold hover:bg-black transition-colors"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-brand-linen shadow-sm overflow-hidden"
                      >
                        {/* Order Header */}
                        <div className="bg-brand-bg/80 px-6 py-4 border-b border-brand-linen flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-6">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/50 block">
                                Order Placed
                              </span>
                              <span className="text-xs font-semibold text-brand-charcoal">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/50 block">
                                Total Amount
                              </span>
                              <span className="text-xs font-bold text-brand-charcoal">
                                ₹{(order.total / 100).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/50 block">
                                Order ID
                              </span>
                              <span className="text-xs font-mono text-brand-charcoal">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              order.status === 'PAID' || order.status === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : order.status === 'CANCELLED'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {order.status === 'PAID' || order.status === 'DELIVERED' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="p-6 divide-y divide-brand-linen">
                          {order.items?.map((item: any) => (
                            <div
                              key={item.id}
                              className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                            >
                              <div className="flex-1">
                                <Link
                                  href={`/products/${item.productId}`}
                                  className="font-bold text-sm text-brand-charcoal hover:text-brand-orange transition-colors line-clamp-1"
                                >
                                  {item.productNameSnapshot}
                                </Link>
                                <p className="text-xs text-brand-charcoal/60 mt-1">
                                  Quantity: <span className="font-semibold text-brand-charcoal">{item.quantity} units</span> &bull; Rate: ₹{(item.priceSnapshot / 100).toLocaleString('en-IN')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm text-brand-charcoal">
                                  ₹{(item.subtotal / 100).toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Delivery Address Snapshot */}
                        {order.addressSnapshot && (
                          <div className="px-6 py-3 bg-brand-bg/50 border-t border-brand-linen text-xs text-brand-charcoal/70 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-brand-charcoal">Delivered to: </span>
                              {order.addressSnapshot.name}, {order.addressSnapshot.city} ({order.addressSnapshot.pincode})
                            </div>
                            <div className="font-mono text-[11px] text-brand-charcoal/50">
                              Phone: {order.addressSnapshot.phone}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SAVED ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold font-serif text-brand-charcoal">
                      Saved Delivery Addresses
                    </h2>
                    <p className="text-xs text-brand-charcoal/60 mt-0.5">
                      Manage studio and workshop delivery addresses for fast checkout
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-charcoal text-white text-xs font-semibold hover:bg-black transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-orange" />
                    Add Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-brand-linen p-12 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center mx-auto mb-4 border border-brand-linen">
                      <MapPin className="w-8 h-8 text-brand-charcoal/40" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-1">
                      No addresses saved yet
                    </h3>
                    <p className="text-sm text-brand-charcoal/60 max-w-md mx-auto mb-6">
                      Save your studio or warehouse address to enable seamless 1-click B2B checkout.
                    </p>
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-charcoal text-white text-sm font-semibold hover:bg-black transition-colors"
                    >
                      <Plus className="w-4 h-4 text-brand-orange" />
                      Add New Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                          addr.isDefault
                            ? 'border-brand-orange shadow-sm ring-1 ring-brand-orange/20'
                            : 'border-brand-linen hover:border-brand-charcoal/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-sm text-brand-charcoal">
                              {addr.name}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-brand-charcoal/80 leading-relaxed">
                            {addr.line1}
                            {addr.line2 ? `, ${addr.line2}` : ''}
                          </p>
                          <p className="text-xs text-brand-charcoal/80 mt-1">
                            {addr.city}, {addr.state} &bull; <span className="font-semibold">{addr.pincode}</span>
                          </p>
                          <p className="text-xs font-medium text-brand-charcoal/60 mt-2">
                            Phone: {addr.phone}
                          </p>
                        </div>

                        <div className="mt-5 pt-3 border-t border-brand-linen flex items-center justify-between">
                          {!addr.isDefault ? (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-xs font-semibold text-brand-charcoal/70 hover:text-brand-orange transition-colors"
                            >
                              Make Default
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Primary Shipping
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-brand-charcoal/40 hover:text-red-600 p-1.5 rounded-lg transition-colors"
                            title="Delete address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PERSONAL DETAILS / PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-serif text-brand-charcoal">
                    Personal Details
                  </h2>
                  <p className="text-xs text-brand-charcoal/60 mt-0.5">
                    Account credentials, customer tier, and primary contact preferences
                  </p>
                </div>

                {/* Account Details Card */}
                <div className="bg-white rounded-2xl border border-brand-linen p-6 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/50 block mb-1">
                        Display Name
                      </label>
                      <div className="font-bold text-base text-brand-charcoal">
                        {user?.displayName || 'Creator'}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/50 block mb-1">
                        Email Address
                      </label>
                      <div className="font-semibold text-sm text-brand-charcoal">
                        {user?.email}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/50 block mb-1">
                        Account Role
                      </label>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-bg text-brand-charcoal border border-brand-linen">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-orange" />
                        {user?.role || 'CUSTOMER'}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/50 block mb-1">
                        Member Since
                      </label>
                      <div className="text-xs font-medium text-brand-charcoal/70">
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Recent'}
                      </div>
                    </div>
                  </div>

                  {/* Seller Status Prompt */}
                  {user?.seller ? (
                    <div className="p-4 rounded-xl bg-brand-bg border border-brand-linen flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-brand-charcoal">
                          Seller Brand: {user.seller.brandName}
                        </h4>
                        <p className="text-xs text-brand-charcoal/60">
                          Status: {user.seller.accountStatus}
                        </p>
                      </div>
                      <Link
                        href="/seller/dashboard"
                        className="px-4 py-2 rounded-xl bg-brand-charcoal text-white text-xs font-semibold hover:bg-black transition-colors shrink-0"
                      >
                        Seller Dashboard &rarr;
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-emerald-900">
                          Are you a Manufacturer or Mould Maker?
                        </h4>
                        <p className="text-xs text-emerald-700">
                          Sell silicone moulds, waxes, and supplies directly to Indian creators.
                        </p>
                      </div>
                      <Link
                        href="/sell"
                        className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shrink-0"
                      >
                        Become a Seller &rarr;
                      </Link>
                    </div>
                  )}

                  <div className="pt-4 border-t border-brand-linen flex items-center justify-between">
                    <button
                      onClick={handleLogout}
                      className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out of this session
                    </button>
                  </div>
                </div>
              </div>
            )}

          </section>
        </div>
      </main>

      {/* Modal: Add Address */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-brand-linen max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <h3 className="font-serif text-xl font-bold text-brand-charcoal mb-1">
              Add New Address
            </h3>
            <p className="text-xs text-brand-charcoal/60 mb-6">
              Enter your complete shipping destination details.
            </p>

            {addressError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {addressError}
              </div>
            )}

            <form onSubmit={handleCreateAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/60 block mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-linen text-sm focus:outline-none focus:border-brand-charcoal"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/60 block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-linen text-sm focus:outline-none focus:border-brand-charcoal"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/60 block mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                  placeholder="Flat/House No., Building, Studio Name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-linen text-sm focus:outline-none focus:border-brand-charcoal"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/60 block mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={addressForm.line2}
                  onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                  placeholder="Street, Landmark, Area"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-linen text-sm focus:outline-none focus:border-brand-charcoal"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/60 block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Mumbai"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-linen text-sm focus:outline-none focus:border-brand-charcoal"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/60 block mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-linen text-sm focus:outline-none focus:border-brand-charcoal"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/60 block mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="^[0-9]{6}$"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    placeholder="400001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-linen text-sm focus:outline-none focus:border-brand-charcoal"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="setDefaultCheckbox"
                  checked={addressForm.setDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, setDefault: e.target.checked })}
                  className="rounded border-brand-linen text-brand-charcoal focus:ring-0"
                />
                <label htmlFor="setDefaultCheckbox" className="text-xs text-brand-charcoal/80 cursor-pointer font-medium">
                  Set as my primary delivery address
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-linen">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-brand-charcoal/70 hover:bg-brand-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-charcoal text-white text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {addressSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BuyerFooter />
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
      </div>
    }>
      <AccountDashboard />
    </Suspense>
  )
}
