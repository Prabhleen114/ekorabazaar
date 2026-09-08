import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const status = searchParams.get('status') || null

    // Only allow known OrderStatus values to prevent injection
    const VALID_STATUSES = ['PAYMENT_PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    const where = status && VALID_STATUSES.includes(status) ? { status: status as any } : {}

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          total: true,
          currency: true,
          createdAt: true,
          addressSnapshot: true,
          customer: { select: { email: true } },
          payments: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              status: true,
              amount: true,
              currency: true,
              razorpayOrderId: true
            }
          }
        }
      }),
      prisma.order.count({ where })
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Admin orders fetch error:', error)
    if (error.message?.includes('FORBIDDEN') || error.message?.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
