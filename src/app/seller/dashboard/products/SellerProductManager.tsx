'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function SellerProductManager({ initialProducts }: { initialProducts: any[] }) {
  const products = initialProducts;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-serif text-brand-charcoal">My Products</h1>
        <Link href="/seller/dashboard/products/create" className="px-5 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-semibold hover:bg-brand-terracotta transition-colors shadow-sm">
          Add New Product
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-linen flex flex-col">
            <div className="aspect-[4/3] bg-brand-bg relative flex items-center justify-center border-b border-brand-linen overflow-hidden">
              {product.imageUrl ? (
                <Image 
                  src={product.imageUrl} 
                  alt={product.title} 
                  fill
                  className="object-cover"
                  unoptimized={product.imageUrl.startsWith("http")}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/og-image.jpg";
                    target.srcset = "";
                  }}
                />
              ) : (
                <Image src="/og-image.jpg" alt="No image" fill className="object-cover opacity-50" />
              )}
              
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  product.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' :
                  product.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800' :
                  product.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-stone-100 text-stone-800'
                }`}>
                  {product.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40 mb-1">
                {product.category || "General"}
              </span>
              <h3 className="font-semibold text-brand-charcoal mb-2 line-clamp-1">{product.title}</h3>
              
              <div className="flex items-center justify-between mb-4 text-sm mt-auto pt-3">
                <span className="font-bold text-lg text-brand-charcoal">₹{(product.price / 100).toFixed(2)}</span>
                
                <div className={`flex items-center gap-1.5 font-medium text-xs ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}
                </div>
              </div>
              
              {product.rejectionReason && product.status === 'REJECTED' && (
                <div className="mb-4 bg-red-50 text-red-700 p-2.5 rounded-lg text-xs font-medium border border-red-100">
                  <span className="font-bold">Reason:</span> {product.rejectionReason}
                </div>
              )}
              
              <Link 
                href={`/seller/dashboard/products/${product.id}/edit`}
                className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-brand-charcoal text-sm font-semibold rounded-xl transition-colors text-center"
              >
                Manage
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="text-center py-20 bg-white border border-brand-linen rounded-3xl mt-6">
          <div className="text-brand-charcoal/30 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-brand-charcoal mb-2">No products yet</h3>
          <p className="text-brand-charcoal/60 mb-6 text-sm">Start listing your wholesale products today.</p>
          <Link href="/seller/dashboard/products/create" className="px-6 py-3 bg-brand-orange text-white rounded-xl text-sm font-semibold hover:bg-brand-terracotta transition-colors shadow-sm inline-block">
            Create First Product
          </Link>
        </div>
      )}
    </div>
  )
}
