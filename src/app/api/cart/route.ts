import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireCustomer } from '@/lib/auth'
import { calculateItemPrice } from '@/lib/pricing'
import { ProductStatus, SellerAccountStatus } from '@prisma/client'

export async function GET() {
  try {
    const session = await requireCustomer()
    const cart = await prisma.cart.findUnique({
      where: { userId: session.userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true, title: true, imageUrl: true, price: true,
                customerPrice: true, stock: true, status: true,
                wholesaleTiers: true,
                seller: { select: { accountStatus: true } }
              }
            }
          }
        }
      }
    })
    if (!cart) return NextResponse.json({ items: [], totalAmount: 0 })

    let totalAmount = 0
    const items = cart.items.map(item => {
      const effectivePrice = calculateItemPrice(item.product, item.quantity)
      const isAvailable = item.product.status === ProductStatus.PUBLISHED &&
        item.product.stock >= item.quantity &&
        (!item.product.seller || item.product.seller.accountStatus === SellerAccountStatus.ACTIVE)
      if (isAvailable) totalAmount += effectivePrice * item.quantity
      return { ...item, effectivePrice, isAvailable }
    })
    return NextResponse.json({ items, totalAmount })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message.startsWith('FORBIDDEN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('GET Cart Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireCustomer()
    const body = await req.json()
    const { productId, quantity = 1 } = body

    if (!productId || typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: 'Invalid product or quantity' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product || product.status !== ProductStatus.PUBLISHED) {
      return NextResponse.json({ error: 'Product not available' }, { status: 400 })
    }
    if (product.price <= 0 || (product.customerPrice !== null && product.customerPrice <= 0)) {
      return NextResponse.json({ error: 'This product is available on quotation only. Please request a quote.' }, { status: 400 })
    }
    if (product.stock < quantity) {
      return NextResponse.json({ error: `Only ${product.stock} units available` }, { status: 400 })
    }

    const cart = await prisma.cart.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId },
      update: {}
    })

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, productId, quantity }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message.startsWith('FORBIDDEN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('POST Cart Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireCustomer()
    const body = await req.json().catch(() => ({}))
    const { itemId } = body

    const cart = await prisma.cart.findUnique({ where: { userId: session.userId } })
    if (!cart) return NextResponse.json({ success: true })

    if (itemId) {
      await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } })
    } else {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message.startsWith('FORBIDDEN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('DELETE Cart Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
