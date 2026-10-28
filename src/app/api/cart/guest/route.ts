import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { calculateItemPrice } from '@/lib/pricing'
import { ProductStatus, SellerAccountStatus } from '@prisma/client'
import catalogProducts from '@/lib/data/products.json'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items = [] } = body

    if (!Array.isArray(items)) {
      return NextResponse.json({ items: [], totalAmount: 0 })
    }

    const productIds = items.map((i: any) => String(i.productId)).filter(Boolean)
    if (productIds.length === 0) {
      return NextResponse.json({ items: [], totalAmount: 0 })
    }

    let products: any[] = []
    try {
      products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true, title: true, imageUrl: true, price: true,
          customerPrice: true, stock: true, status: true,
          wholesaleTiers: true,
          seller: { select: { accountStatus: true } }
        }
      })
    } catch (dbErr) {
      console.warn('Prisma findMany fallback in guest cart:', dbErr)
    }

    let totalAmount = 0
    const populatedItems = items.map((reqItem: any) => {
      let product = products.find(p => String(p.id) === String(reqItem.productId))
      
      // Fallback: If not in DB, search catalogProducts (products.json)
      if (!product) {
        const catalogItem = (catalogProducts as any[]).find(p => String(p.id) === String(reqItem.productId))
        if (catalogItem && !catalogItem.isQuoteOnly && catalogItem.price > 0 && catalogItem.inStock !== false) {
          const rawPricePaise = Math.round((typeof catalogItem.price === 'number' ? catalogItem.price : parseFloat(catalogItem.price || '0')) * 100)
          product = {
            id: String(catalogItem.id),
            title: catalogItem.name || 'Untitled Product',
            price: rawPricePaise,
            customerPrice: rawPricePaise,
            stock: 500,
            status: ProductStatus.PUBLISHED,
            imageUrl: catalogItem.image || '/placeholder-product.svg',
            wholesaleTiers: (catalogItem.tiers || []).map((t: any) => ({
              ...t,
              price: Math.round((Number(t.price) || 0) * 100)
            })),
            seller: { accountStatus: SellerAccountStatus.ACTIVE }
          }
        }
      }

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
