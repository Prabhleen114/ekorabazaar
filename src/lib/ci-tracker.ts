"use client";

/**
 * Ekora Bazaar — Customer Intelligence First-Party Tracker (Task 2)
 *
 * Requirements:
 * - anonymous_id: UUID in first-party cookie + localStorage, preserved 12 months
 * - session_id: rotates after 30 minutes idle or when a new campaign source arrives
 * - UTM and referrer captured on first touch
 * - Batched events sent with navigator.sendBeacon to /api/collect (every 5s or on page exit)
 * - Consent check: reads cookieConsent flag
 * - Identity stitching on login/signup/phone entry
 */

const ANON_COOKIE_NAME = "ekora_ci_aid";
const SESSION_COOKIE_NAME = "ekora_ci_sid";
const LAST_ACTIVITY_KEY = "ekora_ci_last_active";
const UTM_STORAGE_KEY = "ekora_ci_utm";
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export interface CIEventPayload {
  event_id: string;
  anonymous_id: string;
  session_id: string;
  customer_id?: string | null;
  event_name: string;
  product_id?: string | null;
  page_path?: string;
  device?: "mobile" | "desktop" | "tablet";
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  props?: Record<string, any>;
  ts?: string;
  consent?: boolean;
}

// In-memory batch queue
let eventQueue: CIEventPayload[] = [];
let flushTimer: NodeJS.Timeout | null = null;
let isInitialized = false;

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "ci_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return "anon_server";
  let aid = getCookie(ANON_COOKIE_NAME) || localStorage.getItem(ANON_COOKIE_NAME);
  if (!aid) {
    aid = generateUUID();
    setCookie(ANON_COOKIE_NAME, aid, 365); // 12 months
    try {
      localStorage.setItem(ANON_COOKIE_NAME, aid);
    } catch {}
  }
  return aid;
}

export function parseUtmFromUrl(): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  let found = false;

  const fields = ["source", "medium", "campaign", "term", "content"];
  for (const f of fields) {
    const val = params.get(`utm_${f}`);
    if (val) {
      utm[f] = val;
      found = true;
    }
  }

  return found ? utm : null;
}

export function getStoredUtm(): Record<string, string> | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return undefined;
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ses_server";
  const now = Date.now();
  const lastActive = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || "0", 10);
  const currentUtm = parseUtmFromUrl();

  let sid = getCookie(SESSION_COOKIE_NAME);

  // If idle > 30 mins or new campaign arrival, rotate session ID
  const isExpired = !lastActive || now - lastActive > IDLE_TIMEOUT_MS;
  const isNewCampaign = currentUtm && currentUtm.campaign && currentUtm.campaign !== getStoredUtm()?.campaign;

  if (!sid || isExpired || isNewCampaign) {
    sid = "ses_" + generateUUID();
    setCookie(SESSION_COOKIE_NAME, sid, 1);
    if (currentUtm) {
      try {
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(currentUtm));
      } catch {}
    }
  }

  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
  } catch {}

  return sid;
}

export function getDeviceType(): "mobile" | "desktop" | "tablet" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w <= 1024) return "tablet";
  return "desktop";
}

export function hasUserConsent(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const c = localStorage.getItem("cookieConsent");
    return c !== "false";
  } catch {
    return true;
  }
}

/**
 * Flushes all pending events to /api/collect
 */
export function flushCIQueue() {
  if (eventQueue.length === 0) return;
  const batch = [...eventQueue];
  eventQueue = [];

  const payload = JSON.stringify({ events: batch });

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    const success = navigator.sendBeacon("/api/collect", blob);
    if (!success) {
      // Fallback if beacon buffer full
      fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } else if (typeof fetch !== "undefined") {
    fetch("/api/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}

/**
 * Enqueues a customer intelligence event with automatic metadata attachment.
 */
export function trackCI(
  eventName: string,
  options: {
    productId?: string | null;
    props?: Record<string, any>;
    customerId?: string | null;
  } = {}
) {
  if (typeof window === "undefined") return;

  const aid = getOrCreateAnonymousId();
  const sid = getOrCreateSessionId();
  const utm = getStoredUtm() || parseUtmFromUrl() || undefined;
  const device = getDeviceType();
  const consent = hasUserConsent();

  // Retrieve customer ID from storage if not provided
  let cid = options.customerId || null;
  if (!cid) {
    try {
      cid = localStorage.getItem("ekora_ci_cid") || null;
    } catch {}
  }

  const evt: CIEventPayload = {
    event_id: generateUUID(),
    anonymous_id: aid,
    session_id: sid,
    customer_id: cid,
    event_name: eventName,
    product_id: options.productId || null,
    page_path: window.location.pathname,
    device,
    utm,
    props: options.props,
    ts: new Date().toISOString(),
    consent,
  };

  eventQueue.push(evt);

  // Set 5-second automatic batch timer if not running
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushCIQueue();
    }, 5000);
  }
}

/**
 * Stitches anonymous_id to customer_id (e.g. upon login, signup, or phone number entry)
 */
export function linkIdentity(customerId: string) {
  if (typeof window === "undefined" || !customerId) return;
  try {
    localStorage.setItem("ekora_ci_cid", customerId);
  } catch {}

  // Immediately track an identity link event
  trackCI("identity_stitch", { customerId });
  // Flush immediately so server registers the connection without delay
  flushCIQueue();
}

/**
 * Lifecycle setup: attaches visibilitychange, beforeunload, and activity refresh
 */
export function initCITracker() {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  // Flush on page unload or tab switch
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushCIQueue();
    }
  });

  window.addEventListener("pagehide", () => flushCIQueue());
  window.addEventListener("beforeunload", () => flushCIQueue());

  // Capture UTM on page load if present
  const utm = parseUtmFromUrl();
  if (utm) {
    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    } catch {}
  }
}

// ─── Named Trigger Helpers for Release 1 Events ──────────────────────────────

export function trackPageView(pagePath?: string) {
  trackCI("page_view", { props: { pagePath: pagePath || window?.location?.pathname } });
}

export function trackSearch(query: string, resultCount: number) {
  const normQuery = query.toLowerCase().trim();
  if (resultCount === 0) {
    trackCI("search_no_results", { props: { query: normQuery, resultCount: 0 } });
  } else {
    trackCI("search", { props: { query: normQuery, resultCount } });
  }
}

export function trackViewItem(productId: string, inStock: boolean = true) {
  if (!inStock) {
    trackCI("out_of_stock_view", { productId });
  } else {
    trackCI("view_item", { productId });
  }
}

export function trackItemRequest(productId: string, requestedText: string) {
  trackCI("item_request", { productId, props: { requestedText } });
}

export function trackAddToCart(productId: string, quantity: number, unitPrice?: number) {
  trackCI("add_to_cart", { productId, props: { quantity, unitPrice } });
}

export function trackRemoveFromCart(productId: string, quantity: number) {
  trackCI("remove_from_cart", { productId, props: { quantity } });
}

export function trackQuantityChange(productId: string, oldQty: number, newQty: number) {
  trackCI("quantity_change", { productId, props: { oldQty, newQty } });
}

export function trackTierPricingView(productId: string) {
  trackCI("tier_pricing_view", { productId });
}

export function trackCoaClick(productId: string, docUrl?: string) {
  trackCI("coa_click", { productId, props: { docUrl } });
}

export function trackWhatsAppClick(location: string, productId?: string) {
  trackCI("whatsapp_click", { productId, props: { location } });
}

export function trackShippingThresholdView(cartValue: number, threshold: number = 2000) {
  trackCI("shipping_threshold_view", { props: { cartValue, threshold } });
}

export function trackBeginCheckout(cartTotal: number, itemCount: number) {
  trackCI("begin_checkout", { props: { cartTotal, itemCount } });
}

export function trackCheckoutStep(step: number, stepName: string) {
  trackCI("checkout_step", { props: { step, stepName } });
}

export function trackGstFieldFocus() {
  trackCI("gst_field_focus");
}

export function trackGstFieldAbandon() {
  trackCI("gst_field_abandon");
}

export function trackSellerApplyStart() {
  trackCI("seller_apply_start");
}
