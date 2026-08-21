import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import AdminProductActions from './AdminProductActions'

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams: Promise<{ sellerId?: string }>
}) {
  const session = await requireAdmin().catch(() => null)
  if (!session) redirect('/')
  
  const { sellerId } = await searchParams

  const products = await prisma.product.findMany({
    include: { seller: true },
    orderBy: { createdAt: 'desc' },
    where: sellerId ? { sellerId } : { status: 'PENDING_APPROVAL' }
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={product.title}>{product.title}</div>
                  <div className="text-xs text-gray-500 mt-1">ID: {product.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.seller?.brandName || 'Unknown'}</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">{product.sellerId || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">Seller Price: ₹{(product.price / 100).toFixed(2)}</div>
                  <div className="text-sm font-bold text-gray-900 mt-1">
                    Cust Price: {product.customerPrice ? `₹${(product.customerPrice / 100).toFixed(2)}` : 'N/A'}
                  </div>
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
                  {product.status === 'PENDING_APPROVAL' && (
                    <AdminProductActions product={product} />
                  )}
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
