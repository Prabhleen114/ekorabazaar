import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import AdminSellerActions from './AdminSellerActions'

export default async function AdminSellersPage() {
  const session = await requireAdmin().catch(() => null)
  if (!session) redirect('/')

  const sellers = await prisma.seller.findMany({
    include: { 
      businessDetails: true,
      user: true,
      _count: {
        select: { products: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Seller Management</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined / Stats</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statuses</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sellers.map((seller) => (
              <tr key={seller.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">{seller.brandName}</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">ID: {seller.id}</div>
                  <div className="text-sm text-gray-500 mt-1">{seller.businessDetails?.legalName || 'No Legal Name'}</div>
                  <div className="text-xs text-gray-400 mt-1">GSTIN: {seller.businessDetails?.gstin || 'N/A'} • {seller.businessDetails?.gstStatus || 'N/A'}</div>
                  {seller.businessDetails?.tradeName && (
                    <div className="text-xs text-gray-400 mt-1">Trade: {seller.businessDetails.tradeName}</div>
                  )}
                  {seller.businessDetails?.city && (
                    <div className="text-xs text-gray-400 mt-1">Location: {seller.businessDetails.city}, {seller.businessDetails.state}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{seller.user?.email || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="text-sm text-gray-900">{new Date(seller.createdAt).toLocaleDateString()}</div>
                   <div className="text-sm text-gray-500 mt-1">{seller._count.products} Products Listed</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="mb-2">
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      App: {seller.applicationStatus}
                     </span>
                   </div>
                   <div>
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      seller.accountStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      seller.accountStatus === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                     }`}>
                      Acc: {seller.accountStatus}
                     </span>
                   </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <AdminSellerActions seller={seller} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
