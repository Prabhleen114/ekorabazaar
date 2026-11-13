import prisma from '@/lib/db';
import OrderSuccessClient from './OrderSuccessClient';

interface Props {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams?.orderId;

  if (!orderId) {
    return <OrderSuccessClient order={null} error="No order ID was provided." />;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return <OrderSuccessClient order={null} error="Order not found." />;
    }

    const serializedOrder = {
      id: order.id,
      total: order.total,
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      addressSnapshot: order.addressSnapshot as any,
      items: order.items.map((item) => ({
        id: item.id,
        productNameSnapshot: item.productNameSnapshot,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        subtotal: item.subtotal,
      })),
    };

    return <OrderSuccessClient order={serializedOrder} />;
  } catch (err) {
    console.error('Failed to load order for confirmation:', err);
    return <OrderSuccessClient order={null} error="Failed to load order details. Please contact support." />;
  }
}
