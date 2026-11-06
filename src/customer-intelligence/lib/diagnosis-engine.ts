import {
  CauseCode,
  ConfidenceLevel,
  RawEvent,
  SessionDiagnosis,
  SessionRecord,
  StandingFlag,
  SupplierHealthRecord,
} from "./types";

export const RULE_VERSION = "2026.11-v1.0";

export const CAUSE_METADATA: Record<
  CauseCode,
  {
    label: string;
    description: string;
    defaultAction: string;
    badgeColor: string;
    category: "system" | "supply" | "communication" | "compliance" | "shipping" | "pricing" | "trust" | "unknown";
  }
> = {
  technical_failure: {
    label: "Technical Failure",
    description: "Payment failed or 500+ API error occurred during cart or checkout.",
    defaultAction: "Fix the bug; send an apology and retry link by WhatsApp.",
    badgeColor: "bg-red-100 text-red-800 border-red-300",
    category: "system",
  },
  supply_problem: {
    label: "Supply / Stock Problem",
    description: "Product is out of stock or supplier has dispatch delay / high cancellation rate.",
    defaultAction: "Offer an alternative product; escalate to the supplier.",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    category: "supply",
  },
  whatsapp_diverted: {
    label: "WhatsApp Diverted",
    description: "Buyer transitioned off-site to WhatsApp chat to ask questions or negotiate.",
    defaultAction: "Team follows up in the chat; do not treat as lost.",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
    category: "communication",
  },
  gst_block: {
    label: "GST Billing Friction",
    description: "Buyer focused or abandoned at GSTIN / B2B tax invoice fields during checkout.",
    defaultAction: "Add help text; offer to order without GST details.",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    category: "compliance",
  },
  shipping_shock: {
    label: "Shipping Threshold Shock",
    description: "Cart was under the ₹2,000 Free Shipping threshold when shipping fee was revealed.",
    defaultAction: "Show 'Add ₹X for Free Shipping' in cart drawer.",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-300",
    category: "shipping",
  },
  tier_confusion: {
    label: "Tier Pricing Confusion",
    description: "Explored bulk wholesale pricing slabs or shifted quantity steppers without buying.",
    defaultAction: "Show the tier saving inline next to the quantity stepper.",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    category: "pricing",
  },
  trust_hesitation: {
    label: "Trust / Quality Hesitation",
    description: "Inspected COA lab certificates or repeatedly browsed safety / return policies.",
    defaultAction: "Put COA proof on the product page; send the batch report by WhatsApp.",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    category: "trust",
  },
  price_concern: {
    label: "Price Concern",
    description: "Attempted an invalid coupon or reduced item quantity in cart.",
    defaultAction: "Conditional offer only if the customer's lifetime value justifies it.",
    badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-300",
    category: "pricing",
  },
  unknown: {
    label: "Unknown Cause",
    description: "No definitive failure signal detected. Gathering more evidence.",
    defaultAction: "Do nothing; keep collecting evidence.",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    category: "unknown",
  },
};

/**
 * Deterministic hash-based 10% holdout group assignment (page 12 of plan)
 */
export function isVisitorInHoldout(visitorKey: string): boolean {
  let hash = 0;
  for (let i = 0; i < visitorKey.length; i++) {
    hash = (hash << 5) - hash + visitorKey.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 10 === 0; // 10% assigned to holdout
}

/**
 * Diagnoses a session using the 9 ordered rules from the PDF plan (pages 7-8).
 * Order: technical_failure -> supply_problem -> whatsapp_diverted -> gst_block ->
 * shipping_shock -> tier_confusion -> trust_hesitation -> price_concern -> unknown.
 */
export function diagnoseSession(
  session: SessionRecord,
  events: RawEvent[],
  supplierHealth: SupplierHealthRecord[] = []
): SessionDiagnosis {
  const sessionEvents = events.filter((e) => e.session_id === session.session_id);
  const eventNames = new Set(sessionEvents.map((e) => e.event_name));
  const matchedCauses: CauseCode[] = [];
  const evidenceMap: Partial<Record<CauseCode, string[]>> = {};

  // 1. Technical failure check
  const paymentFailEvt = sessionEvents.find((e) => e.event_name === "payment_fail");
  const apiErrorEvt = sessionEvents.find(
    (e) =>
      (e.event_name === "api_error" || e.event_name === "server_error") &&
      (e.props?.status >= 500 || e.props?.code >= 500)
  );

  if (paymentFailEvt || apiErrorEvt) {
    matchedCauses.push("technical_failure");
    evidenceMap.technical_failure = [];
    if (paymentFailEvt) {
      evidenceMap.technical_failure.push(
        `Payment failed with gateway error: ${paymentFailEvt.props?.error_code || paymentFailEvt.props?.reason || "Gateway timeout"}`
      );
    }
    if (apiErrorEvt) {
      evidenceMap.technical_failure.push(
        `API error ${apiErrorEvt.props?.status || 500} on route ${apiErrorEvt.page_path || "/api/checkout"}`
      );
    }
  }

  // 2. Supply problem check
  const oosEvt = sessionEvents.find((e) => e.event_name === "out_of_stock_view");
  const productIds = Array.from(new Set(sessionEvents.map((e) => e.product_id).filter(Boolean))) as string[];
  const flaggedSuppliers = supplierHealth.filter(
    (s) => productIds.includes(s.product_id) && s.is_flagged
  );

  if (oosEvt || flaggedSuppliers.length > 0) {
    matchedCauses.push("supply_problem");
    evidenceMap.supply_problem = [];
    if (oosEvt) {
      evidenceMap.supply_problem.push(
        `Attempted to view or cart zero-stock product: ${oosEvt.props?.product_name || oosEvt.product_id}`
      );
    }
    for (const sup of flaggedSuppliers) {
      evidenceMap.supply_problem.push(
        `Supplier ${sup.seller_name || sup.seller_id} flagged: ${(sup.flag_reasons || ["dispatch or cancellation issue"]).join(", ")}`
      );
    }
  }

  // 3. WhatsApp diverted check
  const waEvts = sessionEvents.filter((e) => e.event_name === "whatsapp_click");
  if (waEvts.length > 0) {
    matchedCauses.push("whatsapp_diverted");
    const wa = waEvts[0];
    evidenceMap.whatsapp_diverted = [
      `Clicked WhatsApp contact button from ${wa.page_path || "PDP"}`,
      wa.props?.inferred_intent ? `Inferred intent: ${wa.props.inferred_intent}` : "Direct wholesale inquiry",
      wa.props?.time_on_page_seconds ? `Dwell before click: ${wa.props.time_on_page_seconds}s` : "Live chat initiated",
    ];
  }

  // 4. GST block check
  const gstFocus = sessionEvents.find((e) => e.event_name === "gst_field_focus");
  const gstAbandon = sessionEvents.find((e) => e.event_name === "gst_field_abandon");
  if (gstAbandon || (gstFocus && !eventNames.has("purchase"))) {
    matchedCauses.push("gst_block");
    evidenceMap.gst_block = [
      "Focused on GST / Business details field in checkout",
      "Session ended with GSTIN field incomplete or abandoned",
      "Requires clarification regarding optional GSTIN or 18% Input Tax Credit",
    ];
  }

  // 5. Shipping shock check
  const shippingEvt = sessionEvents.find((e) => e.event_name === "shipping_threshold_view");
  const freeThreshold = 2000;
  const diff = freeThreshold - session.cart_value;
  if (shippingEvt || (session.cart_value > 0 && session.max_stage === "cart" && diff > 0 && diff <= 450)) {
    matchedCauses.push("shipping_shock");
    evidenceMap.shipping_shock = [
      `Cart value of ₹${session.cart_value.toLocaleString("en-IN")} is ₹${diff.toLocaleString("en-IN")} below ₹${freeThreshold.toLocaleString("en-IN")} free shipping cutoff`,
      "Session exited at or immediately following shipping fee reveal",
      "High probability of recovery with a low-cost wick or fragrance oil add-on",
    ];
  }

  // 6. Tier confusion check
  const tierViews = sessionEvents.filter((e) => e.event_name === "tier_pricing_view");
  const qtyChanges = sessionEvents.filter((e) => e.event_name === "quantity_change");
  if (tierViews.length >= 2 || qtyChanges.length >= 3) {
    matchedCauses.push("tier_confusion");
    evidenceMap.tier_confusion = [
      `Viewed wholesale tier pricing table ${tierViews.length} times`,
      qtyChanges.length > 0
        ? `Adjusted quantity steppers ${qtyChanges.length} times across tier slabs`
        : "Evaluated bulk pricing slabs without reaching cart threshold",
      "Likely uncertain about wholesale minimum quantities or tiered discounts",
    ];
  }

  // 7. Trust hesitation check
  const coaClicks = sessionEvents.filter((e) => e.event_name === "coa_click");
  const policyViews = sessionEvents.filter(
    (e) => e.page_path && (e.page_path.includes("policy") || e.page_path.includes("coa") || e.page_path.includes("quality"))
  );
  if (coaClicks.length >= 2 || (coaClicks.length >= 1 && policyViews.length >= 2)) {
    matchedCauses.push("trust_hesitation");
    evidenceMap.trust_hesitation = [
      `Inspected Certificate of Analysis (COA) / IFRA test reports ${coaClicks.length} times`,
      policyViews.length > 0 ? `Reviewed return/quality policy pages ${policyViews.length} times` : "Quality verification inspection",
      "Buyer seeking lab authenticity validation before committing to bulk order",
    ];
  }

  // 8. Price concern check
  const couponFail = sessionEvents.find(
    (e) => e.event_name === "coupon_fail" || e.event_name === "coupon_attempt"
  );
  const cartRemoves = sessionEvents.filter((e) => e.event_name === "remove_from_cart");
  if (couponFail || cartRemoves.length >= 2) {
    matchedCauses.push("price_concern");
    evidenceMap.price_concern = [
      couponFail ? `Attempted coupon discount that failed or was invalid` : "Reduced cart quantities",
      `Cart modifications before exit indicate price sensitivity`,
    ];
  }

  // Primary Cause is the first matching rule in the strict hierarchy
  const primaryCause: CauseCode = matchedCauses[0] || "unknown";
  const secondaryCauses = matchedCauses.slice(1);

  // Confidence calculation as per plan
  let confidence: ConfidenceLevel = "medium";
  if (primaryCause === "technical_failure" || primaryCause === "supply_problem") {
    confidence = "high";
  } else if (primaryCause === "whatsapp_diverted") {
    confidence = "high";
  } else if (primaryCause === "unknown") {
    confidence = "unknown";
  } else if (matchedCauses.length === 1 && (evidenceMap[primaryCause]?.length ?? 0) < 2) {
    confidence = "low";
  }

  const evidence = evidenceMap[primaryCause] || [
    "No distinct hesitation or failure trigger detected",
    `Session visited ${session.pages} pages and reached stage: ${session.max_stage}`,
    "Classified as browse-only or undecided buyer",
  ];

  const meta = CAUSE_METADATA[primaryCause];

  return {
    session_id: session.session_id,
    visitor_key: session.visitor_key,
    cart_value: session.cart_value,
    cause: primaryCause,
    cause_label: meta.label,
    confidence,
    evidence,
    secondary_causes: secondaryCauses,
    suggested_action: meta.defaultAction,
    rule_version: RULE_VERSION,
    diagnosed_at: new Date().toISOString(),
    handled: false,
    handled_at: null,
    handled_by: null,
  };
}

/**
 * Evaluates standing flags for repeat customers (page 12 of plan)
 */
export function evaluateStandingFlags(
  visitorKey: string,
  customerOrders: { id: string; total: number; createdAt: Date; category?: string }[],
  customerName: string,
  customerPhone: string,
  customerEmail: string,
  lastVisitAt?: Date
): StandingFlag[] {
  const flags: StandingFlag[] = [];
  const now = new Date();

  if (customerOrders.length === 0) return flags;

  // Sort orders descending
  const sortedOrders = [...customerOrders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const lastOrder = sortedOrders[0];
  const daysSinceLastOrder = Math.floor((now.getTime() - lastOrder.createdAt.getTime()) / (1000 * 3600 * 24));

  // Calculate average order interval if 3+ orders
  if (sortedOrders.length >= 3) {
    let totalIntervalDays = 0;
    for (let i = 0; i < sortedOrders.length - 1; i++) {
      const diff = Math.floor(
        (sortedOrders[i].createdAt.getTime() - sortedOrders[i + 1].createdAt.getTime()) / (1000 * 3600 * 24)
      );
      totalIntervalDays += diff;
    }
    const avgGapDays = Math.round(totalIntervalDays / (sortedOrders.length - 1));

    // Rule: reorder_due (days since last order > avgGap)
    if (daysSinceLastOrder > avgGapDays) {
      flags.push({
        visitor_key: visitorKey,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        flag: "reorder_due",
        flag_label: "Reorder Due",
        evidence: [
          `Customer has ${sortedOrders.length} completed orders`,
          `Average purchase interval is ${avgGapDays} days`,
          `Last order was ₹${(lastOrder.total / 100).toLocaleString("en-IN")} placed ${daysSinceLastOrder} days ago (${daysSinceLastOrder - avgGapDays} days overdue)`,
        ],
        confidence: "high",
        action: "WhatsApp reminder with a one-tap reorder link",
        first_detected_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
        resolved: false,
      });
    }
  } else if (sortedOrders.length === 2) {
    // 2 orders: shown as low confidence and not acted on (page 12: 'two points do not make a cycle')
    const gap = Math.floor(
      (sortedOrders[0].createdAt.getTime() - sortedOrders[1].createdAt.getTime()) / (1000 * 3600 * 24)
    );
    if (daysSinceLastOrder > gap) {
      flags.push({
        visitor_key: visitorKey,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        flag: "reorder_due",
        flag_label: "Reorder Due (Low Confidence)",
        evidence: [
          "Customer has only 2 completed orders (provisional cycle)",
          `Gap between first and second order was ${gap} days`,
          "Plan rule: Two points do not make a cycle — monitor without outbound nudge",
        ],
        confidence: "low",
        action: "Do not act yet; wait for 3rd order to establish reliable cadence",
        first_detected_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
        resolved: false,
      });
    }
  }

  // Rule: high_value_at_risk
  const lifetimeSpent = sortedOrders.reduce((sum, o) => sum + o.total, 0) / 100;
  if (lifetimeSpent >= 25000 && daysSinceLastOrder >= 40) {
    flags.push({
      visitor_key: visitorKey,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      flag: "high_value_at_risk",
      flag_label: "High Value at Risk",
      evidence: [
        `Top-tier customer with lifetime spend of ₹${lifetimeSpent.toLocaleString("en-IN")}`,
        `No orders placed in ${daysSinceLastOrder} days`,
        "Account at risk of churn to offline chemical / wax distributors",
      ],
      confidence: "high",
      action: "Priority phone call from founder / senior key account manager (not template message)",
      first_detected_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString(),
      resolved: false,
    });
  }

  return flags;
}
