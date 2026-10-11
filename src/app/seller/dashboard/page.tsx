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

  const publishedProductsCount = await prisma.product.count({
    where: {
      sellerId: session.sellerId,
      status: 'PUBLISHED'
    }
  })

  const isActive = seller.accountStatus === 'ACTIVE'
  const isUnderReview = seller.applicationStatus === 'UNDER_REVIEW'
  const isPendingPayment = seller.applicationStatus === 'DRAFT' || seller.applicationStatus === 'SUBMITTED'
  const isVerified = seller.businessDetails?.gstStatus === 'VERIFIED'
  const badgeLabel = isVerified ? 'Verified Seller' : 'Sells on Ekora Bazaar'

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
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="flex gap-4 flex-wrap">
              <Link href="/seller/dashboard/products" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                Manage Products
              </Link>
              <Link href="/seller/dashboard/orders" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                View Orders
              </Link>
              {publishedProductsCount >= 3 && (
                <Link href={`/store/${seller.id}`} target="_blank" className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-sm font-medium hover:bg-amber-100">
                  View Public Storefront →
                </Link>
              )}
            </div>
          </div>

          {/* Storefront Share & Backlink Badges */}
          {publishedProductsCount >= 3 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Your Public Storefront &amp; Website Badges</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Share your wholesale storefront with buyers or embed official badges on your website.
                  </p>
                </div>
                <span className="text-xs font-mono bg-stone-100 text-stone-700 px-3 py-1 rounded-md">
                  https://www.ekorabazaar.in/store/{seller.id}
                </span>
              </div>

              <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 mt-4 mb-2">
                <span className="font-semibold">Recommendation: </span>
                Please prefer using your brand name for backlink anchor text. Brand-focused links look most natural to buyers and search engines.
              </div>

              <div className="space-y-4 text-sm mt-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Snippet 1 (Default): Brand Name Anchor</h3>
                  <code className="block p-3 bg-stone-50 rounded-lg border border-stone-200 font-mono text-xs text-stone-800 select-all overflow-x-auto">
                    {`<a href="https://www.ekorabazaar.in/store/${seller.id}" target="_blank" rel="noopener">${seller.brandName}</a>`}
                  </code>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Snippet 2 (Alternative): Keyword-Style Anchor</h3>
                  <code className="block p-3 bg-stone-50 rounded-lg border border-stone-200 font-mono text-xs text-stone-800 select-all overflow-x-auto">
                    {`<a href="https://www.ekorabazaar.in/store/${seller.id}" target="_blank" rel="noopener">Buy wholesale craft materials from ${seller.brandName} on Ekora Bazaar</a>`}
                  </code>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Snippet 3: Website Badge Embed ({badgeLabel})</h3>
                  <code className="block p-3 bg-stone-50 rounded-lg border border-stone-200 font-mono text-xs text-stone-800 select-all overflow-x-auto">
                    {`<a href="https://www.ekorabazaar.in/store/${seller.id}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;padding:8px 16px;background:#1c1917;color:#fff;border-radius:8px;font-family:sans-serif;font-size:13px;text-decoration:none;"><span style="color:#f59e0b;margin-right:8px;font-weight:bold;">Ekora Bazaar</span> ${badgeLabel} &bull; ${seller.brandName}</a>`}
                  </code>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Public Storefront &amp; Website Badges</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add 3 products to unlock your public store page ({publishedProductsCount}/3 published).
                </p>
              </div>
              <Link href="/seller/dashboard/products/create" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                Add Products
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
