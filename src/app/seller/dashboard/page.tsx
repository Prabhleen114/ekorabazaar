import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SellerOverviewPage() {
  const session = await requireAuth().catch(() => null)
  if (!session || !session.sellerId) {
    redirect('/sell/start-selling') // Or a dedicated setup page
  }

  const seller = await prisma.seller.findUnique({
    where: { id: session.sellerId },
    include: { businessDetails: true, _count: { select: { products: true, payments: true } } }
  })

  if (!seller) redirect('/sell/start-selling')

  const isActive = seller.accountStatus === 'ACTIVE'
  const isUnderReview = seller.applicationStatus === 'UNDER_REVIEW'
  const isPendingPayment = seller.applicationStatus === 'DRAFT' || seller.applicationStatus === 'SUBMITTED'

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Account Status</h3>
          <p className="text-2xl font-semibold">
            {isActive ? (
              <span className="text-green-600">Active</span>
            ) : isUnderReview ? (
              <span className="text-yellow-600">Under Review</span>
            ) : (
              <span className="text-red-600">Action Required</span>
            )}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">GST Verification</h3>
          <p className="text-2xl font-semibold">
            {seller.businessDetails?.gstStatus === 'VERIFIED' ? (
              <span className="text-green-600">Verified</span>
            ) : seller.businessDetails?.gstStatus === 'PENDING_VERIFICATION' ? (
              <span className="text-yellow-600">Pending</span>
            ) : (
              <span className="text-gray-600">Not Submitted</span>
            )}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Products</h3>
          <p className="text-2xl font-semibold text-gray-900">{seller._count.products}</p>
        </div>
      </div>

      {!isActive && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-md mb-8">
          <h3 className="text-lg font-medium text-yellow-800">Your account is not fully active</h3>
          <div className="mt-2 text-sm text-yellow-700">
            {isPendingPayment ? (
              <p>You need to complete your application and payment before accessing commerce features.</p>
            ) : isUnderReview ? (
              <p>Your application is currently under review. Our administrators are verifying your GST and business details. Commerce features are disabled until approval.</p>
            ) : (
              <p>Please check your application status or contact support.</p>
            )}
          </div>
          {isPendingPayment && (
             <div className="mt-4">
                <Link href="/sell/start-selling" className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700">
                  Complete Application
                </Link>
             </div>
          )}
        </div>
      )}

      {isActive && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="flex gap-4">
             <Link href="/seller/dashboard/products" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
               Manage Products
             </Link>
             <Link href="/seller/dashboard/orders" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
               View Orders
             </Link>
          </div>
        </div>
      )}
    </div>
  )
}
