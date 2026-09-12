import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { calculateItemPrice } from '@/lib/pricing'
import { ProductStatus, SellerAccountStatus } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items = [] } = body

    if (!Array.isArray(items)) {
      return NextResponse.json({ items: [], totalAmount: 0 })
    }

    const productIds = items.map((i: any) => i.productId).filter(Boolean)
    if (productIds.length === 0) {
      return NextResponse.json({ items: [], totalAmount: 0 })
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true, title: true, imageUrl: true, price: true,
        customerPrice: true, stock: true, status: true,
        wholesaleTiers: true,
        seller: { select: { accountStatus: true } }
      }
    })

    let totalAmount = 0
    const populatedItems = items.map((reqItem: any) => {
      const product = products.find(p => p.id === reqItem.productId)
      if (!product) return null

      const quantity = Math.max(1, parseInt(reqItem.quantity) || 1)
      const effectivePrice = calculateItemPrice(product, quantity)
      const isQuoteOnly = product.price <= 0 || (product.customerPrice !== null && product.customerPrice <= 0)

      const isAvailable = product.status === ProductStatus.PUBLISHED &&
        product.stock >= quantity &&
        !isQuoteOnly &&
        (!product.seller || product.seller.accountStatus === SellerAccountStatus.ACTIVE)
      
      if (isAvailable) totalAmount += effectivePrice * quantity

      return {
        id: `guest-${product.id}`,
        productId: product.id,
        quantity,
        effectivePrice,
        isAvailable,
        product
      }
    }).filter(Boolean)

    return NextResponse.json({ items: populatedItems, totalAmount })
  } catch (error: any) {
    console.error('POST Guest Cart Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
