import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import SellerProductForm from '@/components/SellerProductForm'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth().catch(() => null)
  if (!session || !session.sellerId) redirect('/sell/start-selling')

  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id, sellerId: session.sellerId }
  })

  if (!product) notFound()

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold font-serif text-brand-charcoal">Manage Product</h1>
        <p className="text-brand-charcoal/60 mt-2">Update your wholesale product listing details.</p>
      </div>
      <SellerProductForm initialData={product} />
    </div>
  )
}
