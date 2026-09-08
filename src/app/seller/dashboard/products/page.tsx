import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import SellerProductManager from './SellerProductManager'

export default async function SellerProductsPage() {
  const session = await requireAuth().catch(() => null)
  if (!session || !session.sellerId) redirect('/sell/start-selling')

  const seller = await prisma.seller.findUnique({
    where: { id: session.sellerId },
    include: { products: { orderBy: { createdAt: 'desc' } } }
  })

  if (!seller) redirect('/sell/start-selling')

  if (seller.accountStatus !== 'ACTIVE') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Commerce features locked</h3>
          <p className="mt-2 text-sm text-red-700">Your account must be ACTIVE to manage products. Current status: {seller.accountStatus}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <SellerProductManager initialProducts={seller.products} />
    </div>
  )
}
