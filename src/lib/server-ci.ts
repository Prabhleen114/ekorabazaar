import prisma from "@/lib/db";
import { ciStore } from "@/lib/e2e-store";
import crypto from "crypto";

export interface ServerEventData {
  eventName: string;
  sessionId?: string;
  anonymousId?: string;
  customerId?: string | null;
  productId?: string | null;
  pagePath?: string;
  device?: "mobile" | "desktop" | "tablet";
  props?: Record<string, any>;
  utm?: Record<string, any>;
  isSynthetic?: boolean;
}

/**
 * Server-side Customer Intelligence event logger.
 * Writes to PostgreSQL ci_events table and updates the in-memory fallback ciStore.
 */
export async function logServerCI(data: ServerEventData): Promise<void> {
  const eventId = "srv_" + crypto.randomUUID();
  const ts = new Date();
  const sessionId = data.sessionId || "ses_srv_" + (data.customerId || "guest");
  const anonymousId = data.anonymousId || "anon_srv_" + (data.customerId || "guest");

  const record = {
    event_id: eventId,
    ts: ts.toISOString(),
    anonymous_id: anonymousId,
    session_id: sessionId,
    customer_id: data.customerId || null,
    event_name: data.eventName,
    product_id: data.productId || null,
    page_path: data.pagePath || "/api",
    device: data.device || "desktop",
    utm: data.utm,
    props: data.props,
    is_bot: false,
    is_internal: false,
    is_synthetic: data.isSynthetic || false,
  };

  ciStore.rawEvents.push(record as any);

  try {
    await prisma.cIEvent.create({
      data: {
        eventId,
        ts,
        anonymousId,
        sessionId,
        customerId: data.customerId || null,
        eventName: data.eventName,
        productId: data.productId || null,
        pagePath: data.pagePath || "/api",
        device: data.device || "desktop",
        utm: data.utm || undefined,
        props: data.props || undefined,
        isBot: false,
        isInternal: false,
        isSynthetic: data.isSynthetic || false,
      },
    });
  } catch (err) {
    // Telemetry must never crash the primary business logic
    console.error("[Server CI telemetry write error]:", err);
  }
}

export async function logPaymentAttempt(params: {
  orderId: string;
  amount: number;
  customerId?: string | null;
  sessionId?: string;
  gateway?: string;
}) {
  return logServerCI({
    eventName: "payment_attempt",
    customerId: params.customerId,
    sessionId: params.sessionId,
    pagePath: "/api/checkout/create-order",
    props: {
      orderId: params.orderId,
      amount: params.amount,
      gateway: params.gateway || "RAZORPAY",
    },
  });
}

export async function logPaymentFail(params: {
  orderId?: string;
  errorCode?: string;
  errorDescription?: string;
  amount?: number;
  customerId?: string | null;
  sessionId?: string;
}) {
  return logServerCI({
    eventName: "payment_fail",
    customerId: params.customerId,
    sessionId: params.sessionId,
    pagePath: "/api/checkout/payment-fail",
    props: {
      orderId: params.orderId,
      errorCode: params.errorCode || "UNKNOWN_ERROR",
      errorDescription: params.errorDescription,
      amount: params.amount,
    },
  });
}

export async function logPurchase(params: {
  orderId: string;
  amount: number;
  itemCount: number;
  customerId?: string | null;
  sessionId?: string;
  source?: string;
}) {
  return logServerCI({
    eventName: "purchase",
    customerId: params.customerId,
    sessionId: params.sessionId,
    pagePath: "/api/checkout/confirm-payment",
    props: {
      orderId: params.orderId,
      amount: params.amount,
      itemCount: params.itemCount,
      source: params.source || "website",
    },
  });
}

export async function logApiError(params: {
  route: string;
  status: number;
  latencyMs: number;
  errorMessage?: string;
  customerId?: string | null;
  sessionId?: string;
}) {
  return logServerCI({
    eventName: "api_error",
    customerId: params.customerId,
    sessionId: params.sessionId,
    pagePath: params.route,
    props: {
      status: params.status,
      latencyMs: params.latencyMs,
      errorMessage: params.errorMessage,
    },
  });
}

export async function logOutOfStockView(params: {
  productId: string;
  customerId?: string | null;
  sessionId?: string;
}) {
  return logServerCI({
    eventName: "out_of_stock_view",
    productId: params.productId,
    customerId: params.customerId,
    sessionId: params.sessionId,
    pagePath: `/products/${params.productId}`,
  });
}
