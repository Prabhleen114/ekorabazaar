import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        subtotal: true,
        tax: true,
        shipping: true,
        total: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        addressSnapshot: true,
        customer: { select: { email: true } },
        items: {
          select: {
            id: true,
            productId: true,
            productNameSnapshot: true,
            priceSnapshot: true,
            quantity: true,
            subtotal: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            provider: true,
            razorpayOrderId: true,
            razorpayPaymentId: true,
            createdAt: true
            // razorpaySignature intentionally excluded
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error: any) {
    console.error('Admin order detail fetch error:', error)
    if (error.message?.includes('FORBIDDEN') || error.message?.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
