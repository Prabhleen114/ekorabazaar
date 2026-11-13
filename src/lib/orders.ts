import prisma from '@/lib/db'
import { OrderStatus, PaymentStatus } from '@prisma/client'

export function getCustomerFacingOrderStatus(status: OrderStatus): string {
  switch (status) {
    case 'PAYMENT_PENDING':
      return 'Order Placed'
    case 'PAID':
      return 'Order Confirmed'
    case 'PROCESSING':
      return 'Preparing Order'
    case 'SHIPPED':
      return 'Shipped'
    case 'IN_TRANSIT':
      return 'In Transit'
    case 'DELIVERED':
      return 'Delivered'
    case 'CANCELLED':
      return 'Cancelled'
    case 'REFUND_INITIATED':
      return 'Refund Initiated'
    case 'REFUNDED':
      return 'Refunded'
    default:
      return status
  }
}

/**
 * Recovers reserved inventory for orders where payment was never completed.
 * Automatically runs via Vercel Cron or on-demand by administrators.
 */
export async function restoreExpiredOrders(minutesThreshold = 30): Promise<number> {
  const thresholdDate = new Date(Date.now() - minutesThreshold * 60 * 1000)

  const expiredOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.PAYMENT_PENDING,
      createdAt: { lt: thresholdDate }
    },
    include: { items: true, payments: true }
  })

  let restoredCount = 0
  for (const order of expiredOrders) {
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          }).catch(() => {})
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            cancellationReason: 'Payment timeout (auto-expired)'
          }
        })

        for (const payment of order.payments) {
          if (payment.status === PaymentStatus.PENDING) {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: PaymentStatus.FAILED, failureReason: 'Payment window expired' }
            })
          }
        }
      })
      restoredCount++
    } catch (err) {
      console.error(`Failed to restore expired order ${order.id}:`, err)
    }
  }

  return restoredCount
}
