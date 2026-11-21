import prisma from '@/lib/db';

export interface CheckoutEventData {
  sessionId?: string | null;
  userId?: string | null;
  cartId?: string | null;
  orderId?: string | null;
  variant?: string | null;
  event: string;
  payload?: any;
}

export async function logCheckoutEvent(data: CheckoutEventData): Promise<void> {
  try {
    await (prisma as any).checkoutEvent.create({
      data: {
        sessionId: data.sessionId || null,
        userId: data.userId || null,
        cartId: data.cartId || null,
        orderId: data.orderId || null,
        variant: data.variant || 'treatment',
        event: data.event,
        payload: data.payload ? JSON.parse(JSON.stringify(data.payload)) : null,
      },
    });
  } catch (err) {
    // Non-blocking telemetry
    console.error(`Failed to log checkout event "${data.event}":`, err);
  }
}
