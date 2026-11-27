'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Package,
  Search,
  Edit2,
  X,
  Upload,
  Image as ImageIcon,
  Star,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderTree,
  Plus,
} from 'lucide-react'

interface CategoryItem {
  name: string
  slug: string
  count: number
}

interface AdminProductItem {
  id: string
  title: string
  description: string
  category: string
  source: string
  status: string
  isActive: boolean
  isLiveOnStorefront: boolean
  stock: number
  moq: number
  sellingPriceINR: number
  mrpINR: number | null
  imageUrl: string
  images: string[]
  sellerId: string | null
  sellerName: string
  inDb: boolean
  updatedAt: string | null
}

function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—'
  return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: val % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })
}

export default function AdminProductManagementPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [totalAllProducts, setTotalAllProducts] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [categorySearch, setCategorySearch] = useState('')

  const [products, setProducts] = useState<AdminProductItem[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sourceFilter, setSourceFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalMatched, setTotalMatched] = useState(0)

  // Editor modal state
  const [editingProduct, setEditingProduct] = useState<AdminProductItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editMrp, setEditMrp] = useState('')
  const [editSellingPrice, setEditSellingPrice] = useState('')
  const [editStock, setEditStock] = useState('0')
  const [editDescription, setEditDescription] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editStatus, setEditStatus] = useState('PUBLISHED')
  const [editImages, setEditImages] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [editorError, setEditorError] = useState('')
  const [previewPendingUrl, setPreviewPendingUrl] = useState<string | null>(null)

  const addFileInputRef = useRef<HTMLInputElement | null>(null)
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null)
  const [replaceTargetIdx, setReplaceTargetIdx] = useState<number | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true)
    try {
      const res = await fetch('/api/admin/product-management/categories', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load categories')
      const data = await res.json()
      setCategories(data.categories || [])
      setTotalAllProducts(data.totalProducts || 0)
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true)
    setErrorMsg('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '24',
        status: statusFilter,
        source: sourceFilter,
      })
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory)
      if (searchQuery.trim()) params.set('q', searchQuery.trim())

      const res = await fetch('/api/admin/product-management/products?' + params.toString(), {
        cache: 'no-store',
      })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Admin session expired. Please log in again.')
        }
        throw new Error('Failed to fetch products')
      }
      const data = await res.json()
      setProducts(data.products || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalMatched(data.pagination?.total || 0)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }, [page, selectedCategory, statusFilter, sourceFilter, searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchCategories()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchCategories])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchProducts()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  const openEditor = (p: AdminProductItem) => {
    setEditingProduct(p)
    setEditTitle(p.title)
    setEditCategory(p.category)
    setEditMrp(p.mrpINR !== null && p.mrpINR !== undefined ? String(p.mrpINR) : '')
    setEditSellingPrice(p.sellingPriceINR > 0 ? String(p.sellingPriceINR) : '')
    setEditStock(String(p.stock ?? 0))
    setEditDescription(p.description || '')
    setEditIsActive(p.isActive)
    setEditStatus(p.status)
    setEditImages(p.images && p.images.length > 0 ? [...p.images] : p.imageUrl ? [p.imageUrl] : [])
    setNewImageUrl('')
    setPreviewPendingUrl(null)
    setEditorError('')
  }

  const closeEditor = () => {
    if (savingProduct) return
    setEditingProduct(null)
    setPreviewPendingUrl(null)
    setEditorError('')
  }

  const uploadImageFile = async (file: File): Promise<string> => {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be less than 5MB')
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      throw new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.')
    }

    const localPreview = URL.createObjectURL(file)
    setPreviewPendingUrl(localPreview)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image')
      }
      return data.url
    } finally {
      URL.revokeObjectURL(localPreview)
      setPreviewPendingUrl(null)
    }
  }

  const handleAddImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploadingImage(true)
    setEditorError('')
    try {
      const url = await uploadImageFile(file)
      setEditImages((prev) => Array.from(new Set([...prev, url])))
    } catch (err: unknown) {
      setEditorError(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleReplaceImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const targetIdx = replaceTargetIdx
    e.target.value = ''
    setReplaceTargetIdx(null)
    if (!file || targetIdx === null) return

    setUploadingImage(true)
    setEditorError('')
    try {
      const url = await uploadImageFile(file)
      setEditImages((prev) => prev.map((img, idx) => (idx === targetIdx ? url : img)))
    } catch (err: unknown) {
      setEditorError(err instanceof Error ? err.message : 'Failed to replace image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim()
    if (!trimmed) return
    if (!trimmed.startsWith('/') && !/^https?:\/\//i.test(trimmed)) {
      setEditorError('Image URL must start with http://, https://, or /')
      return
    }
    setEditorError('')
    setEditImages((prev) => Array.from(new Set([...prev, trimmed])))
    setNewImageUrl('')
  }

  const makePrimaryImage = (idx: number) => {
    setEditImages((prev) => {
      if (idx <= 0 || idx >= prev.length) return prev
      const chosen = prev[idx]
      return [chosen, ...prev.filter((_, i) => i !== idx)]
    })
  }

  const removeImage = (idx: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    setEditorError('')

    const parsedSelling = parseFloat(editSellingPrice)
    if (isNaN(parsedSelling) || parsedSelling <= 0) {
      setEditorError('Selling price must be greater than ₹0.')
      return
    }

    let parsedMrp: number | null = null
    if (editMrp.trim() !== '') {
      parsedMrp = parseFloat(editMrp)
      if (isNaN(parsedMrp) || parsedMrp <= 0) {
        setEditorError('MRP must be greater than ₹0.')
        return
      }
      if (parsedMrp < parsedSelling) {
        setEditorError('MRP must be greater than or equal to Selling Price.')
        return
      }
    }

    const parsedStock = parseInt(editStock, 10)
    if (isNaN(parsedStock) || parsedStock < 0) {
      setEditorError('Stock must be 0 or greater.')
      return
    }

    if (!editTitle.trim()) {
      setEditorError('Product name is required.')
      return
    }

    setSavingProduct(true)
    try {
      const res = await fetch(`/api/admin/product-management/products/${encodeURIComponent(editingProduct.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          category: editCategory.trim(),
          sellingPrice: parsedSelling,
          mrp: parsedMrp,
          stock: parsedStock,
          description: editDescription,
          isActive: editIsActive,
          status: editStatus,
          images: editImages,
          imageUrl: editImages[0] || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update product')
      }

      setSuccessMsg(`Saved changes to "${data.product.title}". Storefront prices & details updated.`)
      setEditingProduct(null)
      fetchProducts()
      fetchCategories()
    } catch (err: unknown) {
      setEditorError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setSavingProduct(false)
    }
  }

  const filteredCategories = categories.filter((c) =>
    !categorySearch.trim() ? true : c.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
  )

  const parsedMrpPreview = parseFloat(editMrp)
  const parsedSellPreview = parseFloat(editSellingPrice)
  const discountPctPreview =
    !isNaN(parsedMrpPreview) && !isNaN(parsedSellPreview) && parsedMrpPreview > parsedSellPreview && parsedMrpPreview > 0
      ? Math.round(((parsedMrpPreview - parsedSellPreview) / parsedMrpPreview) * 100)
      : null

  return (
    <div className="p-4 sm:p-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-7 h-7 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Browse categories, edit MRP &amp; selling prices (INR), descriptions, availability, and product images
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchCategories()
            fetchProducts()
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-black transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Browser Sidebar */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-orange-600" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Categories</h2>
            </div>
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Filter categories..."
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="max-h-[420px] lg:max-h-[600px] overflow-y-auto divide-y divide-gray-50">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL')
                  setPage(1)
                }}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-gray-900 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>All Categories</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    selectedCategory === 'ALL' ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {totalAllProducts}
                </span>
              </button>

              {loadingCategories ? (
                <div className="p-4 text-xs text-gray-400">Loading categories...</div>
              ) : (
                filteredCategories.map((cat) => {
                  const isActive = selectedCategory === cat.name
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.name)
                        setPage(1)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-colors ${
                        isActive
                          ? 'bg-orange-50 text-orange-900 font-semibold border-l-4 border-orange-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          isActive ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Main Products Panel */}
        <div className="lg:col-span-9 space-y-4">
          {/* Search & Filters Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setPage(1)
                setSearchQuery(searchInput)
              }}
              className="flex items-center gap-2 flex-1"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search product name, ID, or keyword..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-black"
              >
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    setSearchQuery('')
                    setPage(1)
                  }}
                  className="px-2.5 py-2 text-xs text-gray-500 hover:text-gray-800"
                >
                  Clear
                </button>
              )}
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter by availability status"
                className="px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg bg-white text-gray-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active / Published</option>
                <option value="INACTIVE">Inactive / Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="REJECTED">Rejected</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter by source"
                className="px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg bg-white text-gray-700"
              >
                <option value="ALL">All Sources</option>
                <option value="EKORA_OFFICIAL">Ekora Official</option>
                <option value="CATALOG">Catalog</option>
                <option value="SELLER">Seller</option>
                <option value="ADMIN">Admin</option>
                <option value="SCRAPER">Scraper</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              Category: <strong className="text-gray-800">{selectedCategory === 'ALL' ? 'All Categories' : selectedCategory}</strong>
            </span>
            <span>{totalMatched} product{totalMatched === 1 ? '' : 's'} found</span>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="p-4">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">MRP</th>
                    <th className="p-4">Selling Price</th>
                    <th className="p-4">Stock &amp; Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingProducts ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">
                        Loading products...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">
                        No products match the selected category and filters.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={product.imageUrl || '/og-image.jpg'}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 line-clamp-1 max-w-xs" title={product.title}>
                                {product.title}
                              </div>
                              <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                                ID: {product.id} &bull; {product.source}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-gray-700">{product.category}</td>
                        <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                          {product.mrpINR !== null ? (
                            <span className="line-through">{formatINR(product.mrpINR)}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="p-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                          {product.sellingPriceINR > 0 ? formatINR(product.sellingPriceINR) : 'Quote / ₹0'}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                product.status === 'PUBLISHED' && product.isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : product.status === 'PENDING_APPROVAL'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : product.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {product.status === 'PUBLISHED' && product.isActive
                                ? 'Active'
                                : !product.isActive
                                ? 'Inactive'
                                : product.status}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Stock: <strong className={product.stock <= 0 ? 'text-red-600' : 'text-gray-800'}>{product.stock}</strong>
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditor(product)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white disabled:opacity-50 text-sm font-medium"
              >
                Previous
              </button>
              <span className="px-3 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white disabled:opacity-50 text-sm font-medium"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Inputs for Upload & Replace */}
      <input
        ref={addFileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleAddImageFile}
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleReplaceImageFile}
      />

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Edit Product</h2>
                <p className="text-xs font-mono text-gray-500">
                  ID: {editingProduct.id} &bull; Source: {editingProduct.source}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200"
                aria-label="Close editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-5 flex-1">
              {editorError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {editorError}
                </div>
              )}

              {/* Product Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                    Category *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {!categories.some((c) => c.name === editCategory) && editCategory && (
                      <option value={editCategory}>{editCategory}</option>
                    )}
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Pricing Section (MRP vs Selling Price in INR) */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Pricing (INR &mdash; Indian Rupees)
                  </h3>
                  {discountPctPreview !== null && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {discountPctPreview}% off MRP
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      MRP (₹) <span className="text-gray-400">(Maximum Retail Price, optional)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={editMrp}
                      onChange={(e) => setEditMrp(e.target.value)}
                      placeholder="e.g. 350"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Selling Price (₹) * <span className="text-gray-400">(Charged at checkout)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={editSellingPrice}
                      onChange={(e) => setEditSellingPrice(e.target.value)}
                      placeholder="e.g. 240"
                      required
                      className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500">
                  Prices are entered in Indian Rupees (₹). Historical orders keep their original price snapshots.
                </p>
              </div>

              {/* Availability & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <label className="text-sm font-medium text-gray-800 cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setEditIsActive(checked)
                        setEditStatus(checked ? 'PUBLISHED' : 'DRAFT')
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span>Active / Available on Storefront</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Publication Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => {
                      const val = e.target.value
                      setEditStatus(val)
                      setEditIsActive(val === 'PUBLISHED')
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live)</option>
                    <option value="DRAFT">DRAFT (Hidden)</option>
                    <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Detailed formulation, specifications, usage notes..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Image Management */}
              <div className="space-y-3 p-4 rounded-xl border border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-orange-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Product Images ({editImages.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => addFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-black disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingImage ? 'Uploading...' : 'Upload New Image'}
                  </button>
                </div>

                {previewPendingUrl && (
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewPendingUrl} alt="Uploading preview" className="w-10 h-10 object-cover rounded" />
                    <span>Uploading image preview to CDN...</span>
                  </div>
                )}

                {editImages.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    No images added. Upload an image or paste an image URL below.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {editImages.map((imgUrl, idx) => (
                      <div
                        key={`${imgUrl}-${idx}`}
                        className={`rounded-lg border p-2 bg-gray-50 flex flex-col gap-2 ${
                          idx === 0 ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-200'
                        }`}
                      >
                        <div className="aspect-square w-full bg-white rounded overflow-hidden border border-gray-100 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt={`Product preview ${idx + 1}`} className="w-full h-full object-contain" />
                          {idx === 0 && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-orange-600 text-white text-[10px] font-bold">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          {idx !== 0 ? (
                            <button
                              type="button"
                              onClick={() => makePrimaryImage(idx)}
                              className="inline-flex items-center gap-1 text-orange-700 hover:underline font-medium"
                              title="Set as primary image"
                            >
                              <Star className="w-3 h-3" /> Primary
                            </button>
                          ) : (
                            <span className="text-gray-400">Main photo</span>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={uploadingImage}
                              onClick={() => {
                                setReplaceTargetIdx(idx)
                                replaceFileInputRef.current?.click()
                              }}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Or paste image URL (https://... or /images/products/...)"
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-800 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add URL
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={savingProduct}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct || uploadingImage}
                  className="px-5 py-2 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  {savingProduct ? 'Saving Changes...' : 'Save Product Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
