import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireCustomer } from '@/lib/auth'
import { ProductStatus, SellerAccountStatus } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const session = await requireCustomer()
    const body = await req.json()
    const { items = [] } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: true })
    }

    const productIds = items.map((i: any) => i.productId).filter(Boolean)
    
    // Fetch products to validate existence and stock
    const products = await prisma.product.findMany({
      where: { 
        id: { in: productIds },
        status: ProductStatus.PUBLISHED,
      },
      include: {
        seller: { select: { accountStatus: true } }
      }
    })

    const validProducts = new Map(products.map(p => [p.id, p]))

    const cart = await prisma.cart.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId },
      update: {}
    })

    // Intelligently merge items
    for (const reqItem of items) {
      const product = validProducts.get(reqItem.productId)
      if (!product) continue // Product not available/published

      // Check seller active
      if (product.seller && product.seller.accountStatus !== SellerAccountStatus.ACTIVE) continue

      // Ignore quote only products
      if (product.price <= 0 || (product.customerPrice !== null && product.customerPrice <= 0)) continue

      const requestedQty = Math.max(1, parseInt(reqItem.quantity) || 1)

      // Get existing cart item
      const existingItem = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: product.id } }
      })

      const newQty = existingItem ? existingItem.quantity + requestedQty : requestedQty
      
      // Cap at product stock
      const finalQty = Math.min(newQty, product.stock)

      if (finalQty > 0) {
        await prisma.cartItem.upsert({
          where: { cartId_productId: { cartId: cart.id, productId: product.id } },
          update: { quantity: finalQty },
          create: { cartId: cart.id, productId: product.id, quantity: finalQty }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message.startsWith('FORBIDDEN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('POST Sync Cart Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
