import { OrderStatus } from '@prisma/client'

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
