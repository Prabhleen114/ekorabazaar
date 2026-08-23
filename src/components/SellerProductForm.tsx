'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ALL_CATEGORIES } from '@/lib/categories'
import { X, Upload, Plus, Trash2 } from 'lucide-react'

export default function SellerProductForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter()
  const isEditing = !!initialData

  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [category, setCategory] = useState(initialData?.category || ALL_CATEGORIES[0].id)
  const [price, setPrice] = useState(initialData ? (initialData.price / 100).toString() : '')
  const [stock, setStock] = useState(initialData?.stock?.toString() || '0')
  const [moq, setMoq] = useState(initialData?.moq?.toString() || '1')
  
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')
  const [uploading, setUploading] = useState(false)
  
  const [tiers, setTiers] = useState<any[]>(
    initialData?.wholesaleTiers || []
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // File size check: 5MB Max
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }

    // File type check: JPG, JPEG, PNG, WEBP
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Only JPG, JPEG, PNG, and WEBP files are allowed.")
      return
    }

    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/seller/upload-image', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image')
      }
      
      setImageUrl(data.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const addTier = () => {
    setTiers([...tiers, { minQty: 10, maxQty: null, price: '', discountPct: 0 }])
  }

  const updateTier = (index: number, field: string, value: any) => {
    const newTiers = [...tiers]
    newTiers[index][field] = value
    setTiers(newTiers)
  }

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = isEditing 
        ? `/api/seller/products/${initialData.id}`
        : `/api/seller/products`
        
      const method = isEditing ? 'PATCH' : 'POST'

      const processedTiers = tiers.map(t => ({
        minQty: parseInt(t.minQty),
        maxQty: t.maxQty ? parseInt(t.maxQty) : null,
        price: parseFloat(t.price) || 0,
        discountPct: parseFloat(t.discountPct) || 0
      }))

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description,
          category,
          price: Math.round(parseFloat(price) * 100), 
          stock: parseInt(stock, 10),
          moq: parseInt(moq, 10),
          imageUrl,
          wholesaleTiers: processedTiers
        })
      })
      
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to save product')
      } else {
        router.push('/seller/dashboard/products')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-12">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Image Upload */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-brand-linen shadow-sm">
        <h2 className="text-lg font-bold font-serif text-brand-charcoal mb-6">Product Image</h2>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-full sm:w-48 aspect-square rounded-2xl border-2 border-dashed border-brand-linen bg-stone-50 flex items-center justify-center relative overflow-hidden group">
            {imageUrl ? (
              <>
                <Image src={imageUrl} alt="Preview" fill className="object-cover" unoptimized={imageUrl.startsWith('http')} />
                <button 
                  type="button" 
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="text-center p-4">
                <Upload className="w-8 h-8 text-brand-charcoal/30 mx-auto mb-2" />
                <span className="text-xs font-medium text-brand-charcoal/50">Upload Image</span>
              </div>
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-brand-charcoal/70 mb-4">
              Upload a clear, high-quality image of your product. Max size 5MB.
            </p>
            <label className="inline-block px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-brand-charcoal rounded-xl text-sm font-semibold cursor-pointer transition-colors">
              Choose File
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-brand-linen shadow-sm space-y-6">
        <h2 className="text-lg font-bold font-serif text-brand-charcoal mb-2">Basic Information</h2>
        
        <div>
          <label className="block text-sm font-semibold text-brand-charcoal mb-2">Product Title *</label>
          <input 
            type="text" 
            required 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="w-full border border-brand-linen rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-shadow"
            placeholder="e.g., Premium 100ml Glass Jar"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-charcoal mb-2">Category *</label>
          <select 
            required 
            value={category} 
            onChange={e => setCategory(e.target.value)}
            className="w-full border border-brand-linen rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-shadow bg-white"
          >
            {ALL_CATEGORIES.map((c: any) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-charcoal mb-2">Description</label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            rows={5}
            className="w-full border border-brand-linen rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-shadow resize-none"
            placeholder="Describe the product details, material, usage, etc."
          />
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-brand-linen shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <h2 className="text-lg font-bold font-serif text-brand-charcoal mb-2">Pricing & Inventory</h2>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-brand-charcoal mb-2">Base Price (₹) *</label>
          <input 
            type="number" 
            step="0.01" 
            min="0" 
            required 
            value={price} 
            onChange={e => setPrice(e.target.value)} 
            className="w-full border border-brand-linen rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
            placeholder="e.g. 150"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-charcoal mb-2">Stock Quantity *</label>
          <input 
            type="number" 
            min="0" 
            required 
            value={stock} 
            onChange={e => setStock(e.target.value)} 
            className="w-full border border-brand-linen rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-charcoal mb-2">Minimum Order Quantity (MOQ)</label>
          <input 
            type="number" 
            min="1" 
            required 
            value={moq} 
            onChange={e => setMoq(e.target.value)} 
            className="w-full border border-brand-linen rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
          />
        </div>
      </div>

      {/* Wholesale Tiers */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-brand-linen shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-serif text-brand-charcoal">Wholesale Pricing Tiers</h2>
          <button type="button" onClick={addTier} className="text-brand-orange font-semibold text-sm flex items-center gap-1 hover:text-brand-terracotta">
            <Plus className="w-4 h-4" /> Add Tier
          </button>
        </div>
        
        {tiers.length === 0 ? (
          <p className="text-sm text-brand-charcoal/50 italic">No bulk pricing tiers added.</p>
        ) : (
          <div className="space-y-4">
            {tiers.map((tier, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-end gap-4 p-4 border border-brand-linen bg-stone-50 rounded-xl relative">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/50 mb-1">Min Qty</label>
                  <input type="number" required min={1} value={tier.minQty} onChange={e => updateTier(idx, 'minQty', e.target.value)} className="w-full border border-brand-linen rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/50 mb-1">Max Qty (Optional)</label>
                  <input type="number" min={1} value={tier.maxQty || ''} onChange={e => updateTier(idx, 'maxQty', e.target.value)} className="w-full border border-brand-linen rounded-lg px-3 py-2 text-sm" placeholder="No limit" />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/50 mb-1">Price/Unit (₹)</label>
                  <input type="number" step="0.01" required min={0} value={tier.price} onChange={e => updateTier(idx, 'price', e.target.value)} className="w-full border border-brand-linen rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/50 mb-1">% Off</label>
                  <input type="number" step="0.1" min={0} max={100} value={tier.discountPct} onChange={e => updateTier(idx, 'discountPct', e.target.value)} className="w-full border border-brand-linen rounded-lg px-3 py-2 text-sm" />
                </div>
                <button type="button" onClick={() => removeTier(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-white border border-brand-linen text-brand-charcoal rounded-xl font-semibold hover:bg-stone-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-8 py-3 bg-brand-orange text-white rounded-xl font-semibold hover:bg-brand-terracotta transition-colors shadow-md disabled:opacity-50">
          {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Product')}
        </button>
      </div>
    </form>
  )
}
