'use client'

import { useState } from 'react'

export default function SellerProductManager({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openCreate = () => {
    setEditingProduct(null)
    setTitle('')
    setPrice('')
    setStock('0')
    setError('')
    setIsModalOpen(true)
  }

  const openEdit = (product: any) => {
    setEditingProduct(product)
    setTitle(product.title)
    setPrice((product.price / 100).toFixed(2))
    setStock(product.stock.toString())
    setError('')
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const url = editingProduct 
        ? `/api/seller/products/${editingProduct.id}`
        : `/api/seller/products`
        
      const method = editingProduct ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          price: Math.round(parseFloat(price) * 100), 
          stock: parseInt(stock, 10) 
        })
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to save product')
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (productId: string) => {
    if (!confirm("Submit product for admin approval? You won't be able to edit it until it's reviewed.")) return
    try {
      const res = await fetch(`/api/seller/products/${productId}/submit`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        window.location.reload()
      } else {
        alert(data.error || 'Failed to submit')
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
          Create Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your Selling Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.title}</div>
                  {product.rejectionReason && (
                    <div className="text-xs text-red-500 mt-1">Reason: {product.rejectionReason}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₹{(product.price / 100).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                    product.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                    product.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {(product.status === 'DRAFT' || product.status === 'REJECTED') && (
                    <>
                      <button onClick={() => openEdit(product)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                      <button onClick={() => handleSubmit(product.id)} className="text-green-600 hover:text-green-900">Submit</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  You haven't created any products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Create Product'}</h2>
            {error && <div className="mb-4 text-sm text-red-500">{error}</div>}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Selling Price (₹)</label>
                <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} className="w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className="w-full border rounded-md px-3 py-2" />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium">Cancel</button>
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
