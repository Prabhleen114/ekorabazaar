import prisma from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export interface FlagMetadata {
  key: string;
  label: string;
  description: string;
  suggestedAction: string;
  badgeColor: string;
  category: "intent" | "trust" | "pricing" | "shipping" | "compliance" | "retention" | "supplier";
}

export const FLAG_DEFINITIONS: Record<string, FlagMetadata> = {
  high_intent_no_purchase: {
    key: "high_intent_no_purchase",
    label: "High Intent, No Purchase",
    description: "Repeated PDP visits or catalog browsing without placing an order within 7 days.",
    suggestedAction: "Send limited-time 5% sample pack coupon or tailored category catalog on WhatsApp/Email.",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    category: "intent",
  },
  trust_hesitant: {
    key: "trust_hesitant",
    label: "Trust Hesitant (COA / Quality)",
    description: "Multiple inspections of COA / IFRA lab reports without purchasing.",
    suggestedAction: "Send quality compliance guarantee, batch test summary, and offer a low-MOQ trial order.",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    category: "trust",
  },
  tier_confused: {
    key: "tier_confused",
    label: "Tier Confused (Wholesale Slabs)",
    description: "Multiple quantity stepper adjustments exploring bulk pricing without cart addition.",
    suggestedAction: "Reach out via B2B sales desk offering a custom bulk volume tier quotation.",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
    category: "pricing",
  },
  shipping_friction: {
    key: "shipping_friction",
    label: "Shipping Friction (< ₹300 to Free)",
    description: "Cart value within ₹300 of the ₹2,000 Free Shipping threshold but abandoned.",
    suggestedAction: "Send nudge: 'You are only ₹X away from Free Shipping! Add our sample wick pack to qualify.'",
    badgeColor: "bg-orange-100 text-orange-900 border-orange-300",
    category: "shipping",
  },
  gst_checkout_block: {
    key: "gst_checkout_block",
    label: "GST Checkout Friction",
    description: "Interacted with GST / Business details in checkout but abandoned order.",
    suggestedAction: "WhatsApp message: 'Need assistance claiming 18% GST Input Tax Credit or entering GSTIN?'",
    badgeColor: "bg-red-100 text-red-900 border-red-300",
    category: "compliance",
  },
  reorder_due: {
    key: "reorder_due",
    label: "Reorder Due (21–45 Days)",
    description: "Prior customer whose replenishment window is open (last order 21–45 days ago).",
    suggestedAction: "Trigger automated 1-click reorder link via WhatsApp or email.",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    category: "retention",
  },
  whatsapp_diverted: {
    key: "whatsapp_diverted",
    label: "WhatsApp Diverted (Deep Query)",
    description: "Clicked WhatsApp after reading detailed specs or hesitating before checkout.",
    suggestedAction: "Prioritize inbound WhatsApp chat in CRM; sales agent should close high-touch.",
    badgeColor: "bg-teal-100 text-teal-900 border-teal-300",
    category: "intent",
  },
  supplier_dispatch_risk: {
    key: "supplier_dispatch_risk",
    label: "Supplier Dispatch Risk (> 48h)",
    description: "Orders remaining in PROCESSING or PAID status for over 48 hours without dispatch.",
    suggestedAction: "Alert operations team to expedite supplier dispatch or reassign fulfillment.",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    category: "supplier",
  },
};

export interface FlagJobResult {
  userId: string;
  flag: string;
  evidence: string[];
}

/**
 * Executes the 8 rule-based inference engines and upserts findings into customer_flags.
 */
export async function runIntelligenceFlagJobs(): Promise<{
  success: boolean;
  runAt: string;
  totalFlagsGenerated: number;
  flagCounts: Record<string, number>;
  results: FlagJobResult[];
}> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
  const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const flagResults: FlagJobResult[] = [];
  const flagCounts: Record<string, number> = {
    high_intent_no_purchase: 0,
    trust_hesitant: 0,
    tier_confused: 0,
    shipping_friction: 0,
    gst_checkout_block: 0,
    reorder_due: 0,
    whatsapp_diverted: 0,
    supplier_dispatch_risk: 0,
  };

  try {
    // ------------------------------------------------------------------------
    // Rule 1: high_intent_no_purchase
    // >= 2 tier_pricing_view / add_to_cart in last 7 days, 0 orders placed in last 7 days
    // ------------------------------------------------------------------------
    const highIntentUsers = await prisma.user.findMany({
      where: {
        events: {
          some: {
            eventName: { in: ["tier_pricing_view", "add_to_cart"] },
            createdAt: { gte: sevenDaysAgo },
          },
        },
        orders: {
          none: {
            createdAt: { gte: sevenDaysAgo },
            status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
          },
        },
      },
      include: {
        events: {
          where: {
            eventName: { in: ["tier_pricing_view", "add_to_cart"] },
            createdAt: { gte: sevenDaysAgo },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    for (const user of highIntentUsers) {
      if (user.events.length >= 2) {
        const evidence = [
          `Viewed wholesale tier pricing / added to cart ${user.events.length} times in the last 7 days`,
          `Zero completed orders placed in the last 7 days`,
          `Most recent interaction: ${user.events[0]?.createdAt.toISOString().split("T")[0]}`,
        ];
        flagResults.push({ userId: user.id, flag: "high_intent_no_purchase", evidence });
        flagCounts.high_intent_no_purchase++;
      }
    }

    // ------------------------------------------------------------------------
    // Rule 2: trust_hesitant
    // >= 2 coa_click events in last 14 days, 0 orders in last 14 days
    // ------------------------------------------------------------------------
    const trustUsers = await prisma.user.findMany({
      where: {
        events: {
          some: {
            eventName: "coa_click",
            createdAt: { gte: fourteenDaysAgo },
          },
        },
        orders: {
          none: {
            createdAt: { gte: fourteenDaysAgo },
            status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
          },
        },
      },
      include: {
        events: {
          where: { eventName: "coa_click", createdAt: { gte: fourteenDaysAgo } },
        },
      },
    });

    for (const user of trustUsers) {
      if (user.events.length >= 2) {
        const evidence = [
          `Inspected COA / IFRA lab compliance documents ${user.events.length} times in the last 14 days`,
          `Zero completed orders placed in the last 14 days`,
          `Indicates quality verification interest without purchase commitment`,
        ];
        flagResults.push({ userId: user.id, flag: "trust_hesitant", evidence });
        flagCounts.trust_hesitant++;
      }
    }

    // ------------------------------------------------------------------------
    // Rule 3: tier_confused
    // >= 3 quantity_change events in last 7 days without completed orders
    // ------------------------------------------------------------------------
    const tierConfusedUsers = await prisma.user.findMany({
      where: {
        events: {
          some: {
            eventName: "quantity_change",
            createdAt: { gte: sevenDaysAgo },
          },
        },
        orders: {
          none: {
            createdAt: { gte: sevenDaysAgo },
            status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
          },
        },
      },
      include: {
        events: {
          where: { eventName: "quantity_change", createdAt: { gte: sevenDaysAgo } },
        },
      },
    });

    for (const user of tierConfusedUsers) {
      if (user.events.length >= 3) {
        const evidence = [
          `Adjusted item quantities ${user.events.length} times across tier thresholds in the last 7 days`,
          `Did not proceed to completed purchase`,
          `Buyer likely evaluating custom volume discounts or MOQ pricing slabs`,
        ];
        flagResults.push({ userId: user.id, flag: "tier_confused", evidence });
        flagCounts.tier_confused++;
      }
    }

    // ------------------------------------------------------------------------
    // Rule 4: shipping_friction
    // User triggered shipping_threshold_view with amount_to_free_shipping <= 300, no purchase in 7 days
    // ------------------------------------------------------------------------
    const shippingFrictionEvents = await prisma.event.findMany({
      where: {
        eventName: "shipping_threshold_view",
        createdAt: { gte: sevenDaysAgo },
        userId: { not: null },
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    const shippingUsersChecked = new Set<string>();
    for (const evt of shippingFrictionEvents) {
      if (!evt.userId || shippingUsersChecked.has(evt.userId)) continue;
      shippingUsersChecked.add(evt.userId);

      const meta = (evt.metadata as any) || {};
      const amountRemaining = meta.amount_to_free_shipping || 0;

      if (amountRemaining > 0 && amountRemaining <= 300) {
        // Check if user has since placed an order
        const recentOrder = await prisma.order.findFirst({
          where: {
            customerId: evt.userId,
            createdAt: { gte: evt.createdAt },
            status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
          },
        });

        if (!recentOrder) {
          const evidence = [
            `Viewed Free Shipping threshold with only ₹${Math.round(amountRemaining)} remaining to qualify`,
            `Cart total ₹${Math.round(meta.cart_value || 2000 - amountRemaining)} abandoned without purchase`,
            `High probability of conversion with a low-cost add-on recommendation`,
          ];
          flagResults.push({ userId: evt.userId, flag: "shipping_friction", evidence });
          flagCounts.shipping_friction++;
        }
      }
    }

    // ------------------------------------------------------------------------
    // Rule 5: gst_checkout_block
    // User had gst_field_focus or gst_field_abandon without completing purchase in 7 days
    // ------------------------------------------------------------------------
    const gstEvents = await prisma.event.findMany({
      where: {
        eventName: { in: ["gst_field_focus", "gst_field_abandon"] },
        createdAt: { gte: sevenDaysAgo },
        userId: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });

    const gstUsersChecked = new Set<string>();
    for (const evt of gstEvents) {
      if (!evt.userId || gstUsersChecked.has(evt.userId)) continue;
      gstUsersChecked.add(evt.userId);

      const purchaseSince = await prisma.order.findFirst({
        where: {
          customerId: evt.userId,
          createdAt: { gte: evt.createdAt },
          status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        },
      });

      if (!purchaseSince) {
        const evidence = [
          `Focused or interacted with the GSTIN / Business Invoicing field in checkout`,
          `Abandoned checkout flow without completing payment`,
          `Likely needs assistance with GSTIN verification or B2B invoicing credit`,
        ];
        flagResults.push({ userId: evt.userId, flag: "gst_checkout_block", evidence });
        flagCounts.gst_checkout_block++;
      }
    }

    // ------------------------------------------------------------------------
    // Rule 6: reorder_due
    // Customer placed an order between 21 and 45 days ago, 0 orders in last 14 days
    // ------------------------------------------------------------------------
    const candidatesForReorder = await prisma.user.findMany({
      where: {
        orders: {
          some: {
            createdAt: { gte: fortyFiveDaysAgo, lte: twentyOneDaysAgo },
            status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
          },
          none: {
            createdAt: { gte: fourteenDaysAgo },
            status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
          },
        },
      },
      include: {
        orders: {
          where: {
            status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    for (const user of candidatesForReorder) {
      const lastOrder = user.orders[0];
      if (lastOrder) {
        const daysAgo = Math.round((now.getTime() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const evidence = [
          `Last order of ₹${(lastOrder.total / 100).toLocaleString()} placed ${daysAgo} days ago`,
          `Zero reorders placed in the last 14 days`,
          `Standard craft maker formulation reorder window is 21–35 days`,
        ];
        flagResults.push({ userId: user.id, flag: "reorder_due", evidence });
        flagCounts.reorder_due++;
      }
    }

    // ------------------------------------------------------------------------
    // Rule 7: whatsapp_diverted
    // User clicked WhatsApp with inferred_intent in last 7 days
    // ------------------------------------------------------------------------
    const waEvents = await prisma.event.findMany({
      where: {
        eventName: "whatsapp_click",
        createdAt: { gte: sevenDaysAgo },
        userId: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });

    const waUsersChecked = new Set<string>();
    for (const evt of waEvents) {
      if (!evt.userId || waUsersChecked.has(evt.userId)) continue;
      waUsersChecked.add(evt.userId);

      const meta = (evt.metadata as any) || {};
      const intent = meta.inferred_intent || meta.inferredIntent || "general_inquiry";
      const dwell = meta.time_on_page_seconds || meta.timeSpentSeconds || 0;
      const scrollPct = meta.max_scroll_depth_pct || meta.maxScrollDepthPercent || 0;

      const evidence = [
        `Diverted to WhatsApp with intent: ${intent.replace(/_/g, " ")}`,
        `Dwell time before clicking: ${dwell}s, scroll depth: ${scrollPct}%`,
        `Source product/context: ${meta.product_name || meta.productName || meta.category || "Catalog page"}`,
      ];
      flagResults.push({ userId: evt.userId, flag: "whatsapp_diverted", evidence });
      flagCounts.whatsapp_diverted++;
    }

    // ------------------------------------------------------------------------
    // Rule 8: supplier_dispatch_risk
    // Orders in PROCESSING or PAID older than 48 hours without dispatch
    // Link to the user who placed the order so customer success can intervene
    // ------------------------------------------------------------------------
    const delayedOrders = await prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING] },
        createdAt: { lte: fortyEightHoursAgo },
        dispatchedAt: null,
      },
      include: {
        customer: true,
      },
      take: 20,
    });

    const supplierRiskUsersChecked = new Set<string>();
    for (const order of delayedOrders) {
      if (supplierRiskUsersChecked.has(order.customerId)) continue;
      supplierRiskUsersChecked.add(order.customerId);

      const hoursWaiting = Math.round((now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60));
      const evidence = [
        `Order #${order.id.substring(0, 8)} in ${order.status} status for ${hoursWaiting} hours without dispatch`,
        `Exceeds standard 48-hour dispatch SLA window`,
        `Customer delivery satisfaction at risk — supplier check required`,
      ];
      flagResults.push({ userId: order.customerId, flag: "supplier_dispatch_risk", evidence });
      flagCounts.supplier_dispatch_risk++;
    }

    // ------------------------------------------------------------------------
    // Upsert detected flags into CustomerFlag table
    // ------------------------------------------------------------------------
    for (const item of flagResults) {
      try {
        await prisma.customerFlag.upsert({
          where: {
            userId_flag: {
              userId: item.userId,
              flag: item.flag,
            },
          },
          create: {
            userId: item.userId,
            flag: item.flag,
            evidence: item.evidence,
            resolved: false,
            firstDetectedAt: now,
            lastUpdatedAt: now,
          },
          update: {
            evidence: item.evidence,
            lastUpdatedAt: now,
          },
        });
      } catch (upsertError) {
        console.warn(`[Intelligence] Upsert error for user ${item.userId} flag ${item.flag}:`, upsertError);
      }
    }

    return {
      success: true,
      runAt: now.toISOString(),
      totalFlagsGenerated: flagResults.length,
      flagCounts,
      results: flagResults,
    };
  } catch (error: any) {
    console.error("[Intelligence Engine Error]:", error);
    return {
      success: false,
      runAt: now.toISOString(),
      totalFlagsGenerated: 0,
      flagCounts,
      results: [],
    };
  }
}

// ----------------------------------------------------------------------------
// Anonymous Visitor Drop-off & Hesitation Analytics Engine
// ----------------------------------------------------------------------------

export interface AnonymousSessionDropoff {
  sessionId: string;
  userId: string | null;
  stage: "browsed" | "cart" | "checkout";
  failureMode:
    | "SHIPPING_SHOCK"
    | "CHECKOUT_FRICTION"
    | "TIER_CONFUSION"
    | "TRUST_HESITATION"
    | "WHATSAPP_DIVERTED"
    | "CART_ABANDONED"
    | "CATALOG_BROWSE";
  failureModeLabel: string;
  reason: string;
  evidence: string[];
  productNames: string[];
  eventCount: number;
  durationSec: number;
  firstAt: string;
  lastAt: string;
  suggestedAction: string;
}

export interface FunnelStageData {
  stage: "browsed" | "cart" | "checkout" | "postOrder";
  label: string;
  sublabel: string;
  count: number;
  dropCount: number;
  dropReason: string;
  color: "amber" | "orange" | "red" | "rose";
  sessions: AnonymousSessionDropoff[];
  failureBreakdown: Record<string, number>;
}

export interface SessionDropoffAnalyticsResult {
  totalSessions: number;
  totalEvents: number;
  totalDropoffs: number;
  stages: {
    browsed: FunnelStageData;
    cart: FunnelStageData;
    checkout: FunnelStageData;
    postOrder: FunnelStageData;
  };
  sessions: AnonymousSessionDropoff[];
}

/**
 * Aggregates all raw telemetry events (including anonymous visitors where userId is null),
 * reconstructs user sessions, and classifies why visitors dropped off without completing an order.
 */
export async function getSessionDropoffAnalytics(): Promise<SessionDropoffAnalyticsResult> {
  const emptyResult: SessionDropoffAnalyticsResult = {
    totalSessions: 0,
    totalEvents: 0,
    totalDropoffs: 0,
    stages: {
      browsed: {
        stage: "browsed",
        label: "Browsed, didn't buy",
        sublabel: "Explored products or wholesale tiers but left without adding to cart",
        count: 0,
        dropCount: 0,
        dropReason: "Explored wholesale tiers or lab certs without buying — needs low-risk sample offer",
        color: "amber",
        sessions: [],
        failureBreakdown: {},
      },
      cart: {
        stage: "cart",
        label: "Cart abandoned",
        sublabel: "Added items to cart but dropped off before initiating checkout",
        count: 0,
        dropCount: 0,
        dropReason: "Shipping threshold shock or cart second-thoughts before checkout",
        color: "orange",
        sessions: [],
        failureBreakdown: {},
      },
      checkout: {
        stage: "checkout",
        label: "Checkout friction",
        sublabel: "Initiated checkout flow but abandoned payment or billing info",
        count: 0,
        dropCount: 0,
        dropReason: "Abandoned during checkout step (login gate, shipping address, or GSTIN)",
        color: "red",
        sessions: [],
        failureBreakdown: {},
      },
      postOrder: {
        stage: "postOrder",
        label: "Post-order issues",
        sublabel: "Orders placed needing attention or reorders due",
        count: 0,
        dropCount: 0,
        dropReason: "Delayed supplier dispatch or overdue repeat purchase cycle",
        color: "rose",
        sessions: [],
        failureBreakdown: {},
      },
    },
    sessions: [],
  };

  try {
    const events = await prisma.event.findMany({
      select: {
        sessionId: true,
        userId: true,
        eventName: true,
        productId: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
      take: 2500,
    });

    if (!events || events.length === 0) {
      return emptyResult;
    }

    const sessionsMap = new Map<
      string,
      {
        sessionId: string;
        userId: string | null;
        events: any[];
        eventNames: Set<string>;
        productsViewed: Set<string>;
        productNames: Set<string>;
        firstAt: Date;
        lastAt: Date;
        coaClicks: number;
        qtyChanges: number;
        shippingViews: number;
        whatsappClicks: number;
        checkoutAbandons: number;
        tierViews: number;
      }
    >();

    for (const evt of events) {
      if (!evt.sessionId) continue;
      let s = sessionsMap.get(evt.sessionId);
      if (!s) {
        s = {
          sessionId: evt.sessionId,
          userId: evt.userId,
          events: [],
          eventNames: new Set<string>(),
          productsViewed: new Set<string>(),
          productNames: new Set<string>(),
          firstAt: evt.createdAt,
          lastAt: evt.createdAt,
          coaClicks: 0,
          qtyChanges: 0,
          shippingViews: 0,
          whatsappClicks: 0,
          checkoutAbandons: 0,
          tierViews: 0,
        };
        sessionsMap.set(evt.sessionId, s);
      }
      s.events.push(evt);
      s.eventNames.add(evt.eventName);
      if (evt.userId && !s.userId) s.userId = evt.userId;
      if (evt.productId) s.productsViewed.add(evt.productId);

      const meta = evt.metadata && typeof evt.metadata === "object" ? (evt.metadata as any) : {};
      if (meta.productName || meta.product_name) {
        s.productNames.add(String(meta.productName || meta.product_name));
      }
      if (evt.eventName === "coa_click") s.coaClicks++;
      if (evt.eventName === "quantity_change") s.qtyChanges++;
      if (evt.eventName === "shipping_threshold_view") s.shippingViews++;
      if (evt.eventName === "whatsapp_click") s.whatsappClicks++;
      if (evt.eventName === "checkout_step_abandon") s.checkoutAbandons++;
      if (evt.eventName === "tier_pricing_view" || evt.eventName === "tier_pricing_hover") s.tierViews++;
      s.lastAt = evt.createdAt;
    }

    const FAILURE_MODE_LABELS: Record<string, string> = {
      CHECKOUT_FRICTION: "Checkout Drop-off",
      SHIPPING_SHOCK: "Shipping Threshold Hesitation",
      CART_ABANDONED: "Cart Abandoned",
      TIER_CONFUSION: "Wholesale Tier Confusion",
      TRUST_HESITATION: "Trust / Lab Cert Hesitation",
      WHATSAPP_DIVERTED: "Diverted to WhatsApp",
      CATALOG_BROWSE: "Catalog Browse (No Cart)",
    };

    const classified: AnonymousSessionDropoff[] = [];

    for (const s of sessionsMap.values()) {
      const names = s.eventNames;
      let stage: "browsed" | "cart" | "checkout" = "browsed";
      let failureMode: AnonymousSessionDropoff["failureMode"] = "CATALOG_BROWSE";
      let reason = "Browsed product specifications and catalog without adding to cart";
      let suggestedAction = "Improve product visual previews, showcase customer reviews, and introduce sample kit trial packs.";
      const evidence: string[] = [];

      if (s.productNames.size > 0) {
        const list = Array.from(s.productNames).slice(0, 3);
        evidence.push(`Explored: ${list.join(", ")}${s.productNames.size > 3 ? ` +${s.productNames.size - 3} more` : ""}`);
      }

      if (names.has("begin_checkout") || names.has("checkout_step_abandon")) {
        stage = "checkout";
        failureMode = "CHECKOUT_FRICTION";
        reason = "Initiated checkout flow but abandoned before completing order payment";
        suggestedAction = "Check checkout form fields for friction (e.g. GSTIN, login barriers). Test 1-page guest checkout.";
        if (s.checkoutAbandons > 0) {
          evidence.push(`Explicitly dropped out of checkout step ${s.checkoutAbandons} time(s)`);
        }
        if (s.shippingViews > 0) {
          evidence.push(`Inspected shipping threshold ${s.shippingViews} time(s) before abandoning checkout`);
        }
        if (s.coaClicks > 0) {
          evidence.push(`Checked COA/IFRA lab certification during checkout decision`);
        }
      } else if (names.has("add_to_cart")) {
        stage = "cart";
        if (s.shippingViews > 0) {
          failureMode = "SHIPPING_SHOCK";
          reason = "Added products to cart, inspected shipping fee cutoff threshold, and abandoned";
          suggestedAction = "Display dynamic 'Only ₹X away from Free Shipping!' progress bar in cart drawer.";
          evidence.push(`Inspected shipping fee cutoff threshold ${s.shippingViews} time(s)`);
        } else {
          failureMode = "CART_ABANDONED";
          reason = "Added items to cart but abandoned before proceeding to checkout";
          suggestedAction = "Trigger exit-intent cart saver popup or offer limited-time 5% checkout incentive.";
          evidence.push("Added items to cart without initiating checkout");
        }
      } else {
        stage = "browsed";
        if (s.whatsappClicks > 0) {
          failureMode = "WHATSAPP_DIVERTED";
          reason = "Diverted from catalog to WhatsApp sales desk for bespoke inquiry";
          suggestedAction = "Prioritize inbound WhatsApp customer chat in CRM to close high-touch B2B order.";
          evidence.push("Clicked WhatsApp contact button from product PDP");
        } else if (s.coaClicks > 0) {
          failureMode = "TRUST_HESITATION";
          reason = "Inspected Certificate of Analysis (COA) / IFRA safety reports but hesitated to buy";
          suggestedAction = "Emphasize certified pure quality guarantee and offer a low-MOQ trial tester pack.";
          evidence.push(`Inspected COA/IFRA lab certification ${s.coaClicks} time(s)`);
        } else if (s.qtyChanges >= 3 || s.tierViews >= 3) {
          failureMode = "TIER_CONFUSION";
          reason = "Evaluated bulk volume discount slabs and quantity steppers repeatedly without adding to cart";
          suggestedAction = "Clarify wholesale slab savings or introduce custom sample pack pricing for craft makers.";
          evidence.push(`Toggled quantities ${s.qtyChanges} times and viewed tiers ${s.tierViews} times`);
        } else if (s.events.length >= 4) {
          evidence.push(`Engaged with ${s.events.length} interaction touchpoints across catalog`);
        }
      }

      const durationSec = Math.max(0, Math.round((s.lastAt.getTime() - s.firstAt.getTime()) / 1000));
      if (durationSec > 10) {
        const mins = Math.floor(durationSec / 60);
        const secs = durationSec % 60;
        evidence.push(`Active session duration: ${mins > 0 ? `${mins}m ` : ""}${secs}s`);
      }

      classified.push({
        sessionId: s.sessionId,
        userId: s.userId,
        stage,
        failureMode,
        failureModeLabel: FAILURE_MODE_LABELS[failureMode] || failureMode,
        reason,
        evidence,
        productNames: Array.from(s.productNames),
        eventCount: s.events.length,
        durationSec,
        firstAt: s.firstAt.toISOString(),
        lastAt: s.lastAt.toISOString(),
        suggestedAction,
      });
    }

    // Sort by last active timestamp descending
    classified.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

    let postOrderCount = 0;
    try {
      postOrderCount = await prisma.customerFlag.count({
        where: {
          flag: { in: ["reorder_due", "supplier_dispatch_risk"] },
          resolved: false,
        },
      });
    } catch {
      postOrderCount = 0;
    }

    const browsedSessions = classified.filter((c) => c.stage === "browsed");
    const cartSessions = classified.filter((c) => c.stage === "cart");
    const checkoutSessions = classified.filter((c) => c.stage === "checkout");

    const stages: SessionDropoffAnalyticsResult["stages"] = {
      browsed: {
        stage: "browsed",
        label: "Browsed, didn't buy",
        sublabel: "Explored products or wholesale tiers but left without adding to cart",
        count: browsedSessions.length,
        dropCount: browsedSessions.length,
        dropReason: "Explored wholesale tiers or lab certs without buying — needs low-risk sample offer",
        color: "amber",
        sessions: browsedSessions,
        failureBreakdown: browsedSessions.reduce((acc, c) => {
          acc[c.failureMode] = (acc[c.failureMode] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      cart: {
        stage: "cart",
        label: "Cart abandoned",
        sublabel: "Added items to cart but dropped off before initiating checkout",
        count: cartSessions.length,
        dropCount: cartSessions.length,
        dropReason: "Shipping threshold shock or cart second-thoughts before checkout",
        color: "orange",
        sessions: cartSessions,
        failureBreakdown: cartSessions.reduce((acc, c) => {
          acc[c.failureMode] = (acc[c.failureMode] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      checkout: {
        stage: "checkout",
        label: "Checkout friction",
        sublabel: "Initiated checkout flow but abandoned payment or billing info",
        count: checkoutSessions.length,
        dropCount: checkoutSessions.length,
        dropReason: "Abandoned during checkout step (login gate, shipping address, or GSTIN)",
        color: "red",
        sessions: checkoutSessions,
        failureBreakdown: checkoutSessions.reduce((acc, c) => {
          acc[c.failureMode] = (acc[c.failureMode] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      postOrder: {
        stage: "postOrder",
        label: "Post-order issues",
        sublabel: "Orders placed needing attention or reorders due",
        count: postOrderCount,
        dropCount: postOrderCount,
        dropReason: "Delayed supplier dispatch or overdue repeat purchase cycle",
        color: "rose",
        sessions: [],
        failureBreakdown: {},
      },
    };

    return {
      totalSessions: classified.length,
      totalEvents: events.length,
      totalDropoffs: classified.length,
      stages,
      sessions: classified,
    };
  } catch (err: any) {
    console.error("[SessionDropoffAnalytics Error]:", err);
    return emptyResult;
  }
}

