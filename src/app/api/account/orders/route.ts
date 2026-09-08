import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireCustomer } from '@/lib/auth'

export async function GET() {
  try {
    const session = await requireCustomer()
    const orders = await prisma.order.findMany({
      where: { customerId: session.userId },
      include: {
        items: true,
        payments: { select: { status: true, type: true, amount: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ orders })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message.startsWith('FORBIDDEN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('GET Orders Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
