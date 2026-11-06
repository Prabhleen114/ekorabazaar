import prisma from "@/lib/db";
import { ciStore } from "./e2e-store";
import {
  diagnoseSession,
  evaluateStandingFlags,
  isVisitorInHoldout,
  RULE_VERSION,
} from "./diagnosis-engine";
import { RawEvent, SessionRecord, SupplierHealthRecord } from "./types";

/**
 * Executes the 15-minute Sessionizer Job:
 * Ingests recent events from PostgreSQL ci_events, computes session bounds, stages,
 * detects 24h lost sessions, and flags 7-day recovered sessions.
 */
export async function runSessionizerJob() {
  const since = new Date(Date.now() - 7 * 864e5); // 7-day lookback window

  // 1. Fetch raw events from PostgreSQL
  const dbEvents = await prisma.cIEvent.findMany({
    where: {
      ts: { gte: since },
      isBot: false,
    },
    orderBy: { ts: "asc" },
  });

  if (dbEvents.length === 0) {
    return { sessionsProcessed: 0 };
  }

  // 2. Group by session_id
  const sessionMap = new Map<string, typeof dbEvents>();
  for (const evt of dbEvents) {
    const list = sessionMap.get(evt.sessionId) || [];
    list.push(evt);
    sessionMap.set(evt.sessionId, list);
  }

  // Fetch recent purchases to determine recovery within 7 days
  const recentPurchases = await prisma.order.findMany({
    where: {
      createdAt: { gte: since },
      status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
    },
    select: { customerId: true, createdAt: true },
  });

  const purchasedUserIds = new Set(recentPurchases.map((o) => o.customerId));

  let processedCount = 0;

  for (const [sessionId, events] of sessionMap.entries()) {
    const firstEvt = events[0];
    const lastEvt = events[events.length - 1];

    const startedAt = firstEvt.ts;
    const endedAt = lastEvt.ts;
    const customerId = events.find((e) => e.customerId)?.customerId || null;
    const anonymousId = firstEvt.anonymousId;
    const visitorKey = customerId || anonymousId;

    const source =
      (firstEvt.utm as any)?.source ||
      (firstEvt.props as any)?.source ||
      "direct";
    const device = firstEvt.device || "desktop";
    const pages = events.filter((e) => e.eventName === "page_view").length;

    // Stage progression
    const eventNames = new Set(events.map((e) => e.eventName));
    let maxStage = "view";
    if (eventNames.has("purchase")) {
      maxStage = "purchase";
    } else if (eventNames.has("begin_checkout") || eventNames.has("checkout_step")) {
      maxStage = "checkout";
    } else if (eventNames.has("add_to_cart") || eventNames.has("quantity_change")) {
      maxStage = "cart";
    }

    // Extract maximum cart value seen in events
    let cartValue: number | null = null;
    for (const e of events) {
      const p = e.props as any;
      if (p?.cartValue || p?.cartTotal || p?.subtotal) {
        const val = Number(p.cartValue || p.cartTotal || p.subtotal);
        if (!isNaN(val) && (cartValue === null || val > cartValue)) {
          cartValue = val;
        }
      }
    }

    const hadError = events.some(
      (e) =>
        e.eventName === "payment_fail" ||
        e.eventName === "api_error" ||
        e.eventName === "client_error"
    );

    // Session is lost if it reached cart/checkout, ended > 24 hours ago, and no purchase occurred
    const hoursSinceEnd = (Date.now() - endedAt.getTime()) / (1000 * 60 * 60);
    const reachedCartOrCheckout = maxStage === "cart" || maxStage === "checkout";
    const isLost = reachedCartOrCheckout && hoursSinceEnd >= 24 && !eventNames.has("purchase");

    // Recovered if lost, but visitor purchased subsequently within 7 days
    let isRecovered: boolean | null = null;
    if (isLost && customerId && purchasedUserIds.has(customerId)) {
      isRecovered = true;
    }

    await prisma.cISession.upsert({
      where: { sessionId },
      create: {
        sessionId,
        visitorKey,
        startedAt,
        endedAt,
        source,
        device,
        pages,
        maxStage,
        cartValue: cartValue !== null ? cartValue : undefined,
        hadError,
        isLost,
        isRecovered,
      },
      update: {
        endedAt,
        pages,
        maxStage,
        cartValue: cartValue !== null ? cartValue : undefined,
        hadError,
        isLost,
        isRecovered,
      },
    });

    processedCount++;
  }

  return { sessionsProcessed: processedCount };
}

/**
 * Executes the Hourly Diagnosis Job:
 * For every lost session without a diagnosis, applies the 9-rule decision chain,
 * stores the single ranked cause, confidence, structured evidence, and rule version.
 */
export async function runDiagnosisJob() {
  const lostSessions = await prisma.cISession.findMany({
    where: {
      isLost: true,
      diagnosis: null,
    },
  });

  if (lostSessions.length === 0) {
    return { diagnosedCount: 0 };
  }

  // Load supplier health flags for Rule 2
  const dbSupplierHealth = await prisma.cISupplierHealth.findMany();
  const supplierHealthRecords: SupplierHealthRecord[] = dbSupplierHealth.map((s) => ({
    seller_id: s.sellerId,
    seller_name: s.sellerId,
    product_id: s.productId,
    product_name: s.productId,
    avg_dispatch_days: Number(s.avgDispatchDays),
    cancel_rate: Number(s.cancelRate),
    stockout_days_30d: s.stockoutDays30d,
    listing_completeness: s.listingScore,
    has_coa_upload: s.hasCoaDoc,
    has_photos: true,
    is_flagged: s.isFlagged,
    flag_reasons: [],
    updated_at: s.updatedAt.toISOString(),
  }));

  let diagnosedCount = 0;

  for (const session of lostSessions) {
    // Fetch all events for this session
    const events = await prisma.cIEvent.findMany({
      where: { sessionId: session.sessionId },
      orderBy: { ts: "asc" },
    });

    const rawEvents: RawEvent[] = events.map((e) => ({
      event_id: e.eventId,
      ts: e.ts.toISOString(),
      anonymous_id: e.anonymousId,
      session_id: e.sessionId,
      customer_id: e.customerId,
      event_name: e.eventName as any,
      product_id: e.productId,
      page_path: e.pagePath || "/",
      device: (e.device as any) || "desktop",
      utm: (e.utm as any) || undefined,
      props: (e.props as any) || undefined,
      is_bot: e.isBot,
      is_internal: e.isInternal,
    }));

    const sessionRecord: SessionRecord = {
      session_id: session.sessionId,
      visitor_key: session.visitorKey,
      started_at: session.startedAt.toISOString(),
      ended_at: session.endedAt.toISOString(),
      source: session.source || "direct",
      device: (session.device as any) || "desktop",
      pages: session.pages,
      max_stage: (session.maxStage as any) || "cart",
      cart_value: session.cartValue ? Number(session.cartValue) : 0,
      had_error: session.hadError,
      is_lost: session.isLost,
      is_recovered: session.isRecovered ?? false,
    };

    const diagnosis = diagnoseSession(sessionRecord, rawEvents, supplierHealthRecords);

    await prisma.cISessionDiagnosis.upsert({
      where: { sessionId: session.sessionId },
      create: {
        sessionId: session.sessionId,
        cause: diagnosis.cause,
        confidence: diagnosis.confidence,
        evidence: diagnosis.evidence as any,
        ruleVersion: diagnosis.rule_version || RULE_VERSION,
        diagnosedAt: new Date(),
      },
      update: {
        cause: diagnosis.cause,
        confidence: diagnosis.confidence,
        evidence: diagnosis.evidence as any,
        ruleVersion: diagnosis.rule_version || RULE_VERSION,
      },
    });

    // Also trigger action suggestion with 10% holdout assignment
    const inHoldout = isVisitorInHoldout(session.visitorKey);
    await prisma.cIAction.create({
      data: {
        visitorKey: session.visitorKey,
        cause: diagnosis.cause,
        actionType: diagnosis.suggested_action,
        inHoldout,
        status: inHoldout ? "skipped" : "suggested",
      },
    });

    diagnosedCount++;
  }

  return { diagnosedCount };
}

/**
 * Aggregates daily demand per product into ci_product_daily (views, carts, purchases, searches).
 */
export async function runProductDailyJob() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await prisma.cIEvent.findMany({
    where: {
      ts: { gte: today },
      isBot: false,
    },
  });

  const productMetrics = new Map<
    string,
    {
      views: number;
      carts: number;
      searches: number;
      noResultSearches: number;
      oosViews: number;
      requests: number;
      whatsappClicks: number;
    }
  >();

  for (const e of events) {
    const pid = e.productId || "general";
    const current = productMetrics.get(pid) || {
      views: 0,
      carts: 0,
      searches: 0,
      noResultSearches: 0,
      oosViews: 0,
      requests: 0,
      whatsappClicks: 0,
    };

    if (e.eventName === "view_item") current.views++;
    if (e.eventName === "add_to_cart") current.carts++;
    if (e.eventName === "search") current.searches++;
    if (e.eventName === "search_no_results") current.noResultSearches++;
    if (e.eventName === "out_of_stock_view") current.oosViews++;
    if (e.eventName === "item_request") current.requests++;
    if (e.eventName === "whatsapp_click") current.whatsappClicks++;

    productMetrics.set(pid, current);
  }

  for (const [productId, counts] of productMetrics.entries()) {
    if (productId === "general") continue;

    await prisma.cIProductDaily.upsert({
      where: {
        day_productId: {
          day: today,
          productId,
        },
      },
      create: {
        day: today,
        productId,
        views: counts.views,
        carts: counts.carts,
        searches: counts.searches,
        noResultSearches: counts.noResultSearches,
        oosViews: counts.oosViews,
        requests: counts.requests,
        whatsappClicks: counts.whatsappClicks,
      },
      update: {
        views: counts.views,
        carts: counts.carts,
        searches: counts.searches,
        noResultSearches: counts.noResultSearches,
        oosViews: counts.oosViews,
        requests: counts.requests,
        whatsappClicks: counts.whatsappClicks,
      },
    });
  }

  return { productsAggregated: productMetrics.size };
}

/**
 * Runs the full scheduled intelligence cycle.
 */
export async function runAllIntelligenceCronJobs() {
  const start = Date.now();
  const sessionizerResult = await runSessionizerJob();
  const diagnosisResult = await runDiagnosisJob();
  const productDailyResult = await runProductDailyJob();

  return {
    success: true,
    runAt: new Date().toISOString(),
    durationMs: Date.now() - start,
    sessionizer: sessionizerResult,
    diagnosis: diagnosisResult,
    productDaily: productDailyResult,
  };
}
