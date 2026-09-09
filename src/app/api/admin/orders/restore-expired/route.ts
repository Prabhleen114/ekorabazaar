import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { OrderStatus, PaymentStatus } from '@prisma/client'

export async function POST() {
  try {
    await requireAdmin()

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

    // Find expired PAYMENT_PENDING orders
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.PAYMENT_PENDING,
        createdAt: { lt: thirtyMinutesAgo }
      },
      include: { items: true, payments: true }
    })

    let restoredCount = 0
    for (const order of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        // Restore stock for each item
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          })
        }

        // Mark order as expired / cancelled
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED }
        })

        // Mark payment as failed
        for (const payment of order.payments) {
          if (payment.status === PaymentStatus.PENDING) {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: PaymentStatus.FAILED }
            })
          }
        }
      })
      restoredCount++
    }

    return NextResponse.json({ success: true, restoredCount })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message?.startsWith('FORBIDDEN')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
