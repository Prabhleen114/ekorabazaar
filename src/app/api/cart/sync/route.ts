export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireCustomer } from '@/lib/auth'
import { ProductStatus, SellerAccountStatus } from '@prisma/client'
import catalogProducts from '@/lib/data/products.json'

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
      let product = validProducts.get(reqItem.productId)
      
      // Fallback: If not yet synced in DB, check catalogProducts
      if (!product) {
        const catalogItem = (catalogProducts as any[]).find(p => String(p.id) === String(reqItem.productId));
        if (catalogItem) {
          if (catalogItem.isQuoteOnly || catalogItem.price <= 0 || catalogItem.inStock === false) {
            continue; // Skip invalid products quietly during merge
          }

          const officialUser = await prisma.user.upsert({
            where: { email: 'official@ekorabazaar.in' },
            update: {},
            create: { email: 'official@ekorabazaar.in', role: 'SELLER' }
          });
          const officialSeller = await prisma.seller.upsert({
            where: { id: 'EKO-OFFICIAL-01' },
            update: {},
            create: {
              id: 'EKO-OFFICIAL-01',
              userId: officialUser.id,
              brandName: 'Ekora Official Supplier',
              accountStatus: 'ACTIVE',
              applicationStatus: 'APPROVED'
            }
          });

          const rawPricePaise = Math.round((typeof catalogItem.price === 'number' ? catalogItem.price : parseFloat(catalogItem.price || '0')) * 100);
          product = await prisma.product.upsert({
            where: { id: String(catalogItem.id) },
            update: {},
            create: {
              id: String(catalogItem.id),
              title: catalogItem.name || 'Untitled Product',
              price: rawPricePaise,
              customerPrice: rawPricePaise,
              stock: 500,
              status: ProductStatus.PUBLISHED,
              sellerId: officialSeller.id,
              source: 'EKORA_OFFICIAL',
              category: catalogItem.category || 'General Silicone Moulds',
              imageUrl: catalogItem.image || '/og-image.jpg',
              wholesaleTiers: (catalogItem.tiers || []).map((t: any) => ({
                ...t,
                price: Math.round((Number(t.price) || 0) * 100)
              }))
            },
            include: {
              seller: { select: { accountStatus: true } }
            }
          });
          
          validProducts.set(product.id, product);
        }
      }

      if (!product) continue // Product not available/published

      // Check seller active
      if (product.seller && (product.seller as any).accountStatus !== SellerAccountStatus.ACTIVE) continue

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
