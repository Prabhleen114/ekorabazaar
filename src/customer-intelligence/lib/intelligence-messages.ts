/**
 * Pre-written, personalized WhatsApp message templates per flag type.
 * Used by the admin intelligence portal to give your team exact messages to send.
 */

export interface MessageTemplate {
  /** Short label shown in the UI */
  label: string;
  /** The actual WhatsApp message text, with {name} as a placeholder */
  message: (name: string, evidence: string[]) => string;
}

/** Extracts a concise product/category name from evidence bullets */
function extractContext(evidence: string[]): string {
  const joined = evidence.join(" ");
  // Try to find a category or product name mentioned in evidence
  const match = joined.match(/category[:\s]+([A-Za-z\s&]+)/i) ||
    joined.match(/product[:\s]+([A-Za-z\s&]+)/i);
  return match ? match[1].trim() : "craft raw materials";
}

export const WHATSAPP_TEMPLATES: Record<string, MessageTemplate> = {
  high_intent_no_purchase: {
    label: "High Intent — Warm Outreach",
    message: (name, evidence) => {
      const ctx = extractContext(evidence);
      return `Hi ${name}! 👋 This is the Ekora Wholesale team.\n\nWe noticed you've been exploring our wholesale ${ctx} pricing — we'd love to help you get the best bulk deal for your business.\n\nWould you like a personalised quotation with our current stock availability and volume pricing? We can also arrange a sample batch if you'd like to test quality before ordering.\n\nJust reply here or visit ekorabazaar.in — happy to help! 🙏`;
    },
  },

  trust_hesitant: {
    label: "Trust Hesitant — Quality Reassurance",
    message: (name, evidence) => {
      const ctx = extractContext(evidence);
      return `Hi ${name}! 👋 Ekora Wholesale here.\n\nWe can see you've been reviewing our lab reports for ${ctx} — great attention to quality! 🔬\n\nAll our products come with:\n✅ Certificate of Analysis (COA)\n✅ MSDS / Safety Data Sheet\n✅ IFRA compliance certificate (for fragrances)\n✅ Batch-matched quality guarantee\n\nIf you have any specific purity or quality questions, I can send you the actual batch test results directly here on WhatsApp.\n\nReady to help — just ask! 🙏`;
    },
  },

  tier_confused: {
    label: "Tier Confused — Volume Clarity",
    message: (name, evidence) => {
      return `Hi ${name}! 👋 Ekora Wholesale team here.\n\nLooks like you've been comparing our bulk pricing tiers — let me make it simple for you!\n\n📦 Our wholesale tiers work like this:\n• 1–11 units → Standard price\n• 12–51 units → 10–15% off per unit\n• 52+ units → Up to 25% off per unit\n\nIf you tell me what quantity you're planning to order and which product, I'll give you an exact per-unit price right here — no confusion!\n\nWhat are you looking to stock up on? 😊`;
    },
  },

  shipping_friction: {
    label: "Shipping Friction — Free Shipping Nudge",
    message: (name, evidence) => {
      // Try to extract the ₹ amount from evidence
      const amountMatch = evidence.join(" ").match(/₹(\d+)/);
      const amount = amountMatch ? amountMatch[1] : "a small amount";
      return `Hi ${name}! 👋 Ekora Wholesale here.\n\nQuick tip — you were just ₹${amount} away from FREE standard shipping on your last order! 🚚\n\nYou can add any small item like a wick pack, fragrance tester, or silicone mould to hit the free shipping threshold at ₹2,000.\n\nWant me to suggest a few popular add-ons that crafters usually reorder? Happy to help you save on shipping! 😊`;
    },
  },

  gst_checkout_block: {
    label: "GST Friction — Checkout Help",
    message: (name, evidence) => {
      return `Hi ${name}! 👋 Ekora Wholesale team here.\n\nWe noticed you started checkout but might have had a question about the GST invoicing section.\n\nA few quick clarifications:\n✅ GSTIN is completely optional — you can skip it and still order normally\n✅ If you DO have a GSTIN, we'll generate a proper GST invoice so you can claim 18% Input Tax Credit\n✅ Even without GST, you'll get a standard invoice for your records\n\nWould you like help completing your order? We can also take your order directly over WhatsApp if that's easier! 🛒`;
    },
  },

  reorder_due: {
    label: "Reorder Due — Replenishment Reminder",
    message: (name, evidence) => {
      const daysMatch = evidence.join(" ").match(/(\d+) days ago/);
      const days = daysMatch ? daysMatch[1] : "a few weeks";
      return `Hi ${name}! 👋 Ekora Wholesale here.\n\nJust checking in — it's been about ${days} since your last order, and most of our craft makers reorder around this time! 🕯️\n\nWould you like to reorder the same products, or are you looking to try something new this season?\n\nI can also check if there are any new arrivals in your usual category and share current stock availability.\n\nReply here and I'll get your reorder ready in minutes! ⚡`;
    },
  },

  whatsapp_diverted: {
    label: "WhatsApp Diverted — Follow Up",
    message: (name, evidence) => {
      const ctx = extractContext(evidence);
      return `Hi ${name}! 👋 Ekora Wholesale team following up.\n\nThank you for reaching out about ${ctx}! We want to make sure we answered all your questions fully.\n\nIf you're still evaluating:\n• We can send product samples\n• Share current price list for bulk orders\n• Arrange a quick call with our sourcing team\n\nLet us know how we can help you move forward. We're here! 🙏`;
    },
  },

  supplier_dispatch_risk: {
    label: "Dispatch Risk — Ops Alert",
    message: (name, evidence) => {
      const hoursMatch = evidence.join(" ").match(/(\d+) hours/);
      const hours = hoursMatch ? hoursMatch[1] : "more than expected";
      return `Hi ${name}! 👋 Ekora Customer Success here.\n\nWe're following up on your recent order — it looks like dispatch has taken ${hours} hours longer than our standard 48-hour window, and we sincerely apologise for the delay.\n\nOur team is actively following up with the supplier right now. You'll receive a tracking update within the next few hours.\n\nAs a token of goodwill, we'd like to offer you priority dispatch on your next order. Thank you for your patience! 🙏`;
    },
  },
};

/** Priority ordering for the admin dashboard (highest revenue impact first) */
export const FLAG_PRIORITY_ORDER = [
  "reorder_due",
  "high_intent_no_purchase",
  "shipping_friction",
  "gst_checkout_block",
  "trust_hesitant",
  "tier_confused",
  "supplier_dispatch_risk",
  "whatsapp_diverted",
];

/** Layman-friendly explanation for each flag shown in the admin summary header */
export const FLAG_PLAIN_SUMMARY: Record<string, string> = {
  high_intent_no_purchase: "browsed your products multiple times without buying",
  trust_hesitant: "checked quality documents but hasn't placed an order yet",
  tier_confused: "kept changing quantities without understanding the bulk deal",
  shipping_friction: "left because they were just a little short of free shipping",
  gst_checkout_block: "got stuck or confused at the GST field in checkout",
  reorder_due: "is likely running low on supplies and hasn't reordered yet",
  whatsapp_diverted: "moved the conversation to WhatsApp (follow-up needed)",
  supplier_dispatch_risk: "waiting too long for their order to ship",
};

/** Short action label per flag for the priority queue */
export const FLAG_ACTION_LABEL: Record<string, string> = {
  high_intent_no_purchase: "Send warm outreach",
  trust_hesitant: "Share quality proof",
  tier_confused: "Clarify bulk pricing",
  shipping_friction: "Suggest free shipping add-on",
  gst_checkout_block: "Help complete checkout",
  reorder_due: "Send reorder reminder",
  whatsapp_diverted: "Follow up on WhatsApp",
  supplier_dispatch_risk: "Alert ops team + apologise",
};
