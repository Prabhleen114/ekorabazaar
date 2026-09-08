import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireCustomer } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const session = await requireCustomer()
    const { itemId } = await params
    const body = await req.json()
    const { quantity } = body

    if (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true }
    })
    if (!item || item.cart.userId !== session.userId) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message.startsWith('FORBIDDEN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('PATCH CartItem Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const session = await requireCustomer()
    const { itemId } = await params

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true }
    })
    if (!item || item.cart.userId !== session.userId) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    await prisma.cartItem.delete({ where: { id: itemId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message.startsWith('FORBIDDEN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('DELETE CartItem Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
