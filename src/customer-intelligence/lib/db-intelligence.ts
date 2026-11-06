import prisma from "@/lib/db";
import { CAUSE_METADATA } from "./diagnosis-engine";
import { CauseCode } from "./types";

export interface SessionCartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  slab?: string;
}

export interface VisitJourneyStep {
  id: string;
  timestamp: string;
  relativeTime: string;
  eventName: string;
  label: string;
  pagePath: string;
  iconType: "visit" | "view" | "cart" | "tier" | "coa" | "whatsapp" | "checkout" | "payment" | "error" | "default";
  details?: Record<string, any>;
}

export interface SessionInspectionResult {
  session: {
    sessionId: string;
    visitorKey: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    device: string;
    source: string;
    startedAt: string;
    endedAt: string;
    durationMinutes: number;
    cartValue: number;
    maxStage: string;
    hadError: boolean;
  };
  cart: {
    items: SessionCartItem[];
    cartTotal: number;
    itemCount: number;
    isEmpty: boolean;
  };
  journey: VisitJourneyStep[];
  diagnosis: {
    cause: CauseCode;
    causeLabel: string;
    confidence: string;
    evidence: string[];
    suggestedAction: string;
  };
  whatsappDraft: string;
  waLink: string;
}

export async function getLiveSessionInspection(
  sessionId: string,
  memoryEvents: any[] = [],
  memorySessions: any[] = []
): Promise<SessionInspectionResult | null> {
  let sessionData: any = null;
  let rawEvents: any[] = [];

  // 1. Try fetching from memory store first
  sessionData = memorySessions.find((s) => s.session_id === sessionId);
  if (sessionData) {
    rawEvents = memoryEvents.filter((e) => e.session_id === sessionId);
  }

  // 2. Try fetching from Prisma DB if not found in memory
  if (!sessionData) {
    try {
      const dbSession = await prisma.cISession.findUnique({
        where: { sessionId },
        include: {
          diagnosis: true,
        },
      });

      if (dbSession) {
        sessionData = {
          session_id: dbSession.sessionId,
          visitor_key: dbSession.visitorKey,
          started_at: dbSession.startedAt.toISOString(),
          ended_at: dbSession.endedAt.toISOString(),
          source: dbSession.source,
          device: dbSession.device,
          pages: dbSession.pages,
          max_stage: dbSession.maxStage,
          cart_value: dbSession.cartValue,
          had_error: dbSession.hadError,
          cause: dbSession.diagnosis?.cause || "unknown",
          confidence: dbSession.diagnosis?.confidence || "unknown",
          evidence: (dbSession.diagnosis?.evidence as string[]) || [],
          suggested_action: (CAUSE_METADATA[dbSession.diagnosis?.cause as CauseCode] || CAUSE_METADATA.unknown).defaultAction,
        };

        const dbEvents = await prisma.cIEvent.findMany({
          where: { sessionId },
          orderBy: { ts: "asc" },
        });

        rawEvents = dbEvents.map((e) => ({
          event_id: e.eventId,
          ts: e.ts.toISOString(),
          anonymous_id: e.anonymousId,
          session_id: e.sessionId,
          customer_id: e.customerId,
          event_name: e.eventName,
          page_path: e.pagePath,
          product_id: e.productId,
          props: (e.props as any) || {},
          device: e.device,
        }));
      }
    } catch (err) {
      console.warn("[DB Intelligence] Could not query Prisma for session inspection:", err);
    }
  }

  if (!sessionData) {
    return null;
  }

  // Sort events chronologically
  rawEvents.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  const startTime = new Date(sessionData.started_at).getTime();
  const endTime = new Date(sessionData.ended_at).getTime();
  const durationMs = Math.max(0, endTime - startTime);
  const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

  // Extract Customer Identity if available
  let customerName = sessionData.customer_name || "Guest Visitor";
  let customerPhone = sessionData.customer_phone || "";
  let customerEmail = sessionData.customer_email || "";

  if (sessionData.customer_id && (!customerPhone || customerName === "Guest Visitor")) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: sessionData.customer_id },
        select: { name: true, phone: true, email: true },
      });
      if (user) {
        if (user.name) customerName = user.name;
        if (user.phone) customerPhone = user.phone;
        if (user.email) customerEmail = user.email;
      }
    } catch {
      // Ignore user lookup fail
    }
  }

  // 3. Reconstruct Visitor Cart from Events
  const cartMap = new Map<string, SessionCartItem>();
  for (const evt of rawEvents) {
    const pId = evt.product_id || evt.props?.productId || evt.props?.product_id;
    if (!pId) continue;

    if (evt.event_name === "add_to_cart") {
      const qty = Number(evt.props?.quantity || evt.props?.qty || 1);
      const price = Number(evt.props?.price || evt.props?.unitPrice || 0);
      const name = evt.props?.product_name || evt.props?.title || evt.props?.name || pId;
      const slab = evt.props?.slab || evt.props?.tier;

      if (cartMap.has(pId)) {
        const item = cartMap.get(pId)!;
        item.quantity += qty;
        item.total = item.quantity * item.unitPrice;
      } else {
        cartMap.set(pId, {
          productId: pId,
          name,
          quantity: qty,
          unitPrice: price,
          total: qty * price,
          slab,
        });
      }
    } else if (evt.event_name === "remove_from_cart") {
      const qty = Number(evt.props?.quantity || evt.props?.qty || 1);
      if (cartMap.has(pId)) {
        const item = cartMap.get(pId)!;
        item.quantity -= qty;
        if (item.quantity <= 0) {
          cartMap.delete(pId);
        } else {
          item.total = item.quantity * item.unitPrice;
        }
      }
    }
  }

  const cartItems = Array.from(cartMap.values());
  const calculatedCartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const finalCartValue = sessionData.cart_value > 0 ? sessionData.cart_value : calculatedCartTotal;

  // 4. Build Chronological Visit Journey
  const journey: VisitJourneyStep[] = rawEvents.map((evt, idx) => {
    const evtTime = new Date(evt.ts).getTime();
    const elapsedSec = Math.max(0, Math.round((evtTime - startTime) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const relativeTime = `+${mins}m ${secs < 10 ? "0" : ""}${secs}s`;

    let label = "Visited page";
    let iconType: VisitJourneyStep["iconType"] = "default";

    switch (evt.event_name) {
      case "page_view":
        label = `Landed on ${evt.page_path || "/"}`;
        iconType = "visit";
        break;
      case "view_item":
        label = `Viewed product: ${evt.props?.product_name || evt.product_id || evt.page_path}`;
        iconType = "view";
        break;
      case "tier_pricing_view":
        label = `Inspected wholesale tier pricing slabs (${evt.props?.slab || "bulk volume"})`;
        iconType = "tier";
        break;
      case "quantity_change":
        label = `Changed order quantity to ${evt.props?.new_qty || evt.props?.quantity || "custom units"}`;
        iconType = "tier";
        break;
      case "coa_click":
        label = `Inspected lab COA / purity test document: ${evt.props?.doc_type || "Lab Certificate"}`;
        iconType = "coa";
        break;
      case "add_to_cart":
        label = `Added to cart: ${evt.props?.product_name || evt.product_id} (${evt.props?.quantity || 1} units)`;
        iconType = "cart";
        break;
      case "whatsapp_click":
        label = `Clicked WhatsApp contact button: ${evt.props?.inferred_intent || "Direct Wholesale Inquiry"}`;
        iconType = "whatsapp";
        break;
      case "begin_checkout":
        label = `Initiated checkout (${evt.page_path || "/checkout"})`;
        iconType = "checkout";
        break;
      case "gst_field_focus":
        label = "Clicked / focused into GSTIN / business billing tax field";
        iconType = "checkout";
        break;
      case "gst_field_abandon":
        label = "Exited without completing GSTIN tax details";
        iconType = "checkout";
        break;
      case "shipping_threshold_view":
        label = `Checked delivery fee / shipping threshold: ₹${evt.props?.amount_to_free_shipping || 0} short of free shipping`;
        iconType = "cart";
        break;
      case "coupon_attempt":
      case "coupon_fail":
        label = `Attempted coupon discount: ${evt.props?.code || "promo"} (${evt.props?.reason || "rejected/invalid"})`;
        iconType = "checkout";
        break;
      case "payment_attempt":
        label = `Attempted payment of ₹${(evt.props?.amount || finalCartValue).toLocaleString("en-IN")}`;
        iconType = "payment";
        break;
      case "payment_fail":
        label = `Payment gateway failure: ${evt.props?.error_code || evt.props?.reason || "Declined / Timeout"}`;
        iconType = "error";
        break;
      case "api_error":
        label = `API / Server 5xx error encountered on ${evt.page_path || "/api"}`;
        iconType = "error";
        break;
      default:
        label = `${evt.event_name.replace(/_/g, " ")} on ${evt.page_path || "/"}`;
        iconType = "default";
    }

    return {
      id: evt.event_id || `evt_${idx}`,
      timestamp: evt.ts,
      relativeTime,
      eventName: evt.event_name,
      label,
      pagePath: evt.page_path || "/",
      iconType,
      details: evt.props || {},
    };
  });

  const cause: CauseCode = sessionData.cause || "unknown";
  const causeMeta = CAUSE_METADATA[cause] || CAUSE_METADATA.unknown;

  // Formulate WhatsApp message
  const cartSummary =
    cartItems.length > 0
      ? cartItems.map((i) => `${i.quantity}x ${i.name}`).join(", ")
      : "your wholesale materials";

  let whatsappDraft = "";
  switch (cause) {
    case "technical_failure":
      whatsappDraft = `Hi ${customerName}! 👋 Ekora Wholesale here. We noticed a payment gateway issue during your checkout for ${cartSummary} (₹${finalCartValue.toLocaleString("en-IN")}). Your cart has been reserved! Here is a direct link to retry: https://ekorabazaar.in/checkout?sid=${sessionData.session_id}. Let us know if you need any help! 🙏`;
      break;
    case "gst_block":
      whatsappDraft = `Hi ${customerName}! 👋 Ekora Wholesale here. Quick note regarding your checkout: entering a GST number is completely optional! You can checkout without GST, or if you have a GSTIN, we provide 18% Input Tax Credit invoices. Would you like us to finalize your order for ${cartSummary}? 🛒`;
      break;
    case "shipping_shock":
      whatsappDraft = `Hi ${customerName}! 👋 Ekora Wholesale here. You're just a small add-on away from Free Shipping on ${cartSummary}! Check out small fragrance testers or wicks to qualify: https://ekorabazaar.in/cart 🚚`;
      break;
    case "tier_confusion":
      whatsappDraft = `Hi ${customerName}! 👋 Ekora Wholesale here. We saw you exploring bulk tiers for ${cartSummary}. We offer wholesale slab discounts starting from 12+ units! What volume are you looking for? We can share an instant custom quotation! 📦`;
      break;
    case "trust_hesitation":
      whatsappDraft = `Hi ${customerName}! 👋 Ekora Wholesale here. We saw you were reviewing our lab compliance reports. All batches of ${cartSummary} are 100% IFRA & COA tested. Would you like our lab team to share the purity certificate for this batch? 🔬`;
      break;
    default:
      whatsappDraft = `Hi ${customerName}! 👋 Ekora Wholesale here. We noticed you were exploring ${cartSummary} on our portal. If you need any assistance with volume pricing, dispatch timelines, or custom batches, we are happy to assist! 🕯️`;
  }

  const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappDraft)}` : "";

  return {
    session: {
      sessionId: sessionData.session_id,
      visitorKey: sessionData.visitor_key,
      customerName,
      customerPhone,
      customerEmail,
      device: sessionData.device || "desktop",
      source: sessionData.source || "direct",
      startedAt: sessionData.started_at,
      endedAt: sessionData.ended_at,
      durationMinutes,
      cartValue: finalCartValue,
      maxStage: sessionData.max_stage || "view",
      hadError: Boolean(sessionData.had_error),
    },
    cart: {
      items: cartItems,
      cartTotal: finalCartValue,
      itemCount: cartItems.reduce((acc, i) => acc + i.quantity, 0),
      isEmpty: cartItems.length === 0,
    },
    journey,
    diagnosis: {
      cause,
      causeLabel: causeMeta.label,
      confidence: sessionData.confidence || "medium",
      evidence: sessionData.evidence || [],
      suggestedAction: sessionData.suggested_action || causeMeta.defaultAction,
    },
    whatsappDraft,
    waLink,
  };
}
