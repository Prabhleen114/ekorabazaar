'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout'
import { Check, Plus, Loader2, Building2, ShieldCheck } from 'lucide-react'
import { TrackBeginCheckout } from '@/components/GA4Tracker'
import { trackEvent } from '@/lib/tracking'

export default function CheckoutPage() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' })
  
  // GST & Business Invoicing State
  const [showGstForm, setShowGstForm] = useState(false)
  const [gstin, setGstin] = useState('')
  const [businessName, setBusinessName] = useState('')
  const gstFocusedRef = useRef(false)
  const paymentCompletedRef = useRef(false)
  const cartTotalRef = useRef(0)
  const itemCountRef = useRef(0)

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const { checkout, isProcessing } = useRazorpayCheckout()

  useEffect(() => {
    fetchData()

    return () => {
      if (!paymentCompletedRef.current && cartTotalRef.current > 0) {
        if (gstFocusedRef.current) {
          trackEvent("gst_field_abandon", {
            cart_total: cartTotalRef.current / 100,
            item_count: itemCountRef.current,
          })
        }
        trackEvent("checkout_step_abandon", {
          step: "payment",
          cart_total: cartTotalRef.current / 100,
          item_count: itemCountRef.current,
        })
      }
    }
  }, [])

  const fetchData = async () => {
    try {
      const [cartRes, addrRes] = await Promise.all([
        fetch('/api/cart'),
        fetch('/api/addresses')
      ])

      if (cartRes.status === 401 || cartRes.status === 403) {
        router.push('/login?redirect=/checkout')
        return
      }

      const cartData = await cartRes.json()
      const addrData = await addrRes.json()

      const availableItems = (cartData.items || []).filter((i: any) => i.isAvailable)
      if (availableItems.length === 0) {
        router.push('/cart')
        return
      }

      const cartTotal = cartData.totalAmount || 0
      setItems(availableItems)
      setTotal(cartTotal)
      cartTotalRef.current = cartTotal
      itemCountRef.current = availableItems.length

      // Telemetry: begin_checkout event
      trackEvent("begin_checkout", {
        cart_total: cartTotal / 100,
        item_count: availableItems.length,
      })
      
      const userAddrs = addrData.addresses || []
      setAddresses(userAddrs)
      if (userAddrs.length > 0) {
        const def = userAddrs.find((a: any) => a.isDefault)
        setSelectedAddressId(def ? def.id : userAddrs[0].id)
      } else {
        setShowNewAddressForm(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAddress, setDefault: true })
      })
      if (!res.ok) throw new Error('Failed to save address')
      const data = await res.json()
      setAddresses([data.address, ...addresses.map(a => ({...a, isDefault: false}))])
      setSelectedAddressId(data.address.id)
      setShowNewAddressForm(false)
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const handlePay = () => {
    if (!selectedAddressId) {
      setErrorMsg('Please select a delivery address')
      return
    }
    setErrorMsg('')
    
    import('@next/third-parties/google').then(({ sendGAEvent }) => {
      sendGAEvent('event', 'add_payment_info', {
        currency: 'INR',
        value: total / 100,
        payment_type: 'Razorpay',
        items: items.map(item => ({
          item_id: item.productId || item.id,
          item_name: item.product?.title || item.title,
          price: item.effectivePrice ? item.effectivePrice / 100 : item.price,
          quantity: item.quantity
        }))
      });
    });

    checkout({
      apiCreateRoute: '/api/checkout/create-order',
      apiVerifyRoute: '/api/checkout/confirm-payment',
      createPayload: { 
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        addressId: selectedAddressId,
        gstin: gstin.trim() || undefined,
        businessName: businessName.trim() || undefined,
      },
      name: 'Ekora Bazaar Checkout',
      description: `Payment for ${items.length} items`,
      onSuccess: (data) => {
        import('@next/third-parties/google').then(({ sendGAEvent }) => {
          sendGAEvent('event', 'purchase', {
            transaction_id: data.orderId,
            value: total / 100,
            currency: 'INR',
            items: items.map(item => ({
              item_id: item.productId || item.id,
              item_name: item.product?.title || item.title,
              price: item.effectivePrice ? item.effectivePrice / 100 : item.price,
              quantity: item.quantity
            }))
          });
        });
        paymentCompletedRef.current = true
        trackEvent("purchase", {
          order_id: data.orderId,
          cart_total: total / 100,
          item_count: items.length,
          gst_provided: !!gstin.trim(),
        })
        router.push('/account/orders')
      },
      onError: (err) => {
        setErrorMsg(err)
      }
    })
  }

  if (loading) return <div className="min-h-screen p-8 text-center">Loading checkout...</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold font-serif mb-8">Checkout</h1>
      <TrackBeginCheckout items={items} value={total / 100} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* ADDRESS SECTION */}
          <div className="bg-white p-6 rounded-2xl border border-brand-linen shadow-sm">
            <h2 className="text-xl font-bold mb-6">Delivery Address</h2>
            
            {!showNewAddressForm ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {addresses.map(addr => (
                    <div 
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                        selectedAddressId === addr.id ? 'border-brand-orange bg-brand-orange/5' : 'border-brand-linen hover:border-brand-orange/50'
                      }`}
                    >
                      {selectedAddressId === addr.id && (
                        <div className="absolute top-4 right-4 text-brand-orange"><Check className="w-5 h-5" /></div>
                      )}
                      <p className="font-bold">{addr.name}</p>
                      <p className="text-sm mt-1">{addr.line1}</p>
                      {addr.line2 && <p className="text-sm">{addr.line2}</p>}
                      <p className="text-sm">{addr.city}, {addr.state} {addr.pincode}</p>
                      <p className="text-sm mt-2 font-medium">Phone: {addr.phone}</p>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setShowNewAddressForm(true)}
                  className="flex items-center gap-2 text-brand-orange font-medium hover:text-brand-terracotta"
                >
                  <Plus className="w-4 h-4" /> Add New Address
                </button>
              </>
            ) : (
              <form onSubmit={handleSaveAddress} className="space-y-4 max-w-lg">
                <div><label className="text-sm font-medium">Full Name</label><input required value={newAddress.name} onChange={e=>setNewAddress({...newAddress, name: e.target.value})} className="w-full border rounded p-2" /></div>
                <div><label className="text-sm font-medium">Phone Number</label><input required value={newAddress.phone} onChange={e=>setNewAddress({...newAddress, phone: e.target.value})} className="w-full border rounded p-2" /></div>
                <div><label className="text-sm font-medium">Flat, House no., Building</label><input required value={newAddress.line1} onChange={e=>setNewAddress({...newAddress, line1: e.target.value})} className="w-full border rounded p-2" /></div>
                <div><label className="text-sm font-medium">Area, Street, Sector, Village</label><input value={newAddress.line2} onChange={e=>setNewAddress({...newAddress, line2: e.target.value})} className="w-full border rounded p-2" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium">City</label><input required value={newAddress.city} onChange={e=>setNewAddress({...newAddress, city: e.target.value})} className="w-full border rounded p-2" /></div>
                  <div><label className="text-sm font-medium">State</label><input required value={newAddress.state} onChange={e=>setNewAddress({...newAddress, state: e.target.value})} className="w-full border rounded p-2" /></div>
                </div>
                <div><label className="text-sm font-medium">Pincode</label><input required value={newAddress.pincode} onChange={e=>setNewAddress({...newAddress, pincode: e.target.value})} className="w-full border rounded p-2" /></div>
                
                <div className="pt-4 flex gap-4">
                  <button type="submit" className="bg-brand-charcoal text-white px-6 py-2 rounded font-medium">Save Address</button>
                  {addresses.length > 0 && <button type="button" onClick={() => setShowNewAddressForm(false)} className="text-gray-500">Cancel</button>}
                </div>
              </form>
            )}
          </div>

          {/* GST & B2B INVOICING SECTION */}
          <div className="bg-white p-6 rounded-2xl border border-brand-linen shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-bg flex items-center justify-center text-brand-orange">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Business GST Invoicing (Optional)</h2>
                  <p className="text-xs text-brand-charcoal/60">Claim 18% GST Input Tax Credit on your wholesale purchase</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGstForm(!showGstForm)}
                className="text-xs font-semibold text-brand-orange hover:underline"
              >
                {showGstForm ? 'Collapse' : '+ Add GSTIN'}
              </button>
            </div>

            {showGstForm && (
              <div className="mt-5 pt-5 border-t border-brand-linen space-y-4 max-w-lg">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 block mb-1">
                    GSTIN (15 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={gstin}
                    onFocus={() => {
                      if (!gstFocusedRef.current) {
                        gstFocusedRef.current = true
                        trackEvent("gst_field_focus", {
                          cart_total: total / 100,
                          item_count: items.length,
                        })
                      }
                    }}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full border border-brand-linen rounded-xl p-3 text-sm font-mono uppercase focus:border-brand-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 block mb-1">
                    Registered Business Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Craft Industries LLP"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full border border-brand-linen rounded-xl p-3 text-sm focus:border-brand-orange focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>GST invoice will be generated and dispatched with your order.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY SECTION */}
        <div>
          <div className="bg-white p-6 rounded-2xl border border-brand-linen shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1 pr-4">
                    <p className="font-medium line-clamp-2">{item.product.title}</p>
                    <p className="text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-semibold">₹{((item.effectivePrice * item.quantity) / 100).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-linen pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{(total / 100).toLocaleString()}</span>
              </div>
            </div>

            {errorMsg && <div className="text-red-500 text-sm font-semibold mb-4 bg-red-50 p-3 rounded">{errorMsg}</div>}

            <button 
              onClick={handlePay}
              disabled={isProcessing || !selectedAddressId}
              className="w-full bg-brand-orange hover:bg-brand-terracotta text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
              {isProcessing ? 'Processing Payment...' : 'Pay with Razorpay'}
            </button>
            <p className="text-center text-xs text-gray-500 mt-4">Secure payment powered by Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  )
}