import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import AdminPriceRequestActions from './AdminPriceRequestActions'
import Image from 'next/image'

export default async function AdminPriceRequestsPage() {
  const session = await requireAdmin().catch(() => null)
  if (!session) redirect('/')
  
  const requests = await prisma.priceChangeRequest.findMany({
    include: { product: true, seller: true },
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Price Change Requests</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((req) => (
              <tr key={req.id}>
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-bg rounded overflow-hidden relative">
                    <Image src={req.product.imageUrl || '/og-image.jpg'} alt="Product" fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={req.product.title}>{req.product.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{req.product.category}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{req.seller.brandName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 line-through">Old: ₹{(req.oldPrice / 100).toFixed(2)}</div>
                  <div className="text-sm font-bold text-gray-900 mt-1">
                    New: ₹{(req.requestedPrice / 100).toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {req.reason || 'No reason provided'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <AdminPriceRequestActions request={req} />
                </td>
              </tr>
            ))}

            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  No pending price change requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
