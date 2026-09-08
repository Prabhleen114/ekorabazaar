import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function SellerProfilePage() {
  const session = await requireAuth().catch(() => null)
  if (!session || !session.sellerId) redirect('/sell/start-selling')

  const seller = await prisma.seller.findUnique({
    where: { id: session.sellerId },
    include: { businessDetails: true }
  })

  if (!seller) redirect('/sell/start-selling')

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Business Profile</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">Brand Information</h2>
          <p className="text-sm text-gray-500 mt-1">This is how your brand appears to customers.</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Brand Name</label>
            <input type="text" readOnly className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-500 cursor-not-allowed" value={seller.brandName} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">Legal Business Details</h2>
          <p className="text-sm text-gray-500 mt-1">Information submitted for verification. Contact support to change these details.</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Legal Name</label>
            <input type="text" readOnly className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-500 cursor-not-allowed" value={seller.businessDetails?.legalName || ''} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Type</label>
            <input type="text" readOnly className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-500 cursor-not-allowed" value={seller.businessDetails?.businessType || ''} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Registered Address</label>
            <textarea readOnly className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-500 cursor-not-allowed" rows={3} value={seller.businessDetails?.address || ''} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">GSTIN</label>
            <input type="text" readOnly className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-500 cursor-not-allowed" value={seller.businessDetails?.gstin || 'Not Provided'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">GST Verification Status</label>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {seller.businessDetails?.gstStatus || 'NOT_SUBMITTED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
