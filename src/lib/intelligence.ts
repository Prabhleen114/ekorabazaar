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
