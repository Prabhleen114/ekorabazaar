"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";

export interface EngagementMetrics {
  timeOnPageSeconds: number;
  maxScrollDepthPct: number;
  scrollDurationSeconds: number;
}

export interface WhatsAppClickPayload {
  location: "floating" | "pdp_quote" | "pdp_quote_sticky" | "buyer_footer" | "footer" | string;
  productId?: string;
  productName?: string;
  category?: string;
  searchQuery?: string;
  customIntent?: string;
  extra?: Record<string, any>;
}

// Global active engagement store to provide instantaneous access anywhere
let currentEngagement: EngagementMetrics = {
  timeOnPageSeconds: 0,
  maxScrollDepthPct: 0,
  scrollDurationSeconds: 0,
};

let pageStartTime = typeof window !== "undefined" ? Date.now() : 0;
let lastScrollTimestamp = 0;
let accumulatedScrollMs = 0;
let highestScrollPct = 0;

/**
 * Gets or creates a persistent session ID stored in cookie and localStorage.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  try {
    let sid = localStorage.getItem("ekora_session_id");
    if (!sid) {
      sid = "ses_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      localStorage.setItem("ekora_session_id", sid);
      document.cookie = `ekora_session_id=${sid}; path=/; max-age=2592000; SameSite=Lax`;
    }
    return sid;
  } catch {
    return "ses_fallback_" + Date.now();
  }
}

/**
 * Generic telemetry event dispatcher for Customer Intelligence Layer.
 * Emits to Google Analytics 4 and internal /api/events DB ingestion endpoint.
 */
export function trackEvent(
  eventName: string,
  params: {
    productId?: string;
    product_id?: string;
    userId?: string;
    user_id?: string;
    [key: string]: any;
  } = {}
) {
  if (typeof window === "undefined") return;

  const sessionId = getOrCreateSessionId();
  const productId = params.productId || params.product_id;
  const userId = params.userId || params.user_id;

  const payload = {
    eventName,
    sessionId,
    userId: userId || null,
    productId: productId || null,
    metadata: {
      ...params,
      pathname: window.location.pathname,
      timestamp: new Date().toISOString(),
    },
  };

  // 1. Dispatch to GA4
  try {
    sendGAEvent("event", eventName, {
      session_id: sessionId,
      product_id: productId,
      ...params,
    });
  } catch (err) {
    // ignore
  }

  // 2. Dispatch to fallback window.gtag if present
  try {
    if ((window as any).gtag) {
      (window as any).gtag("event", eventName, {
        session_id: sessionId,
        product_id: productId,
        ...params,
      });
    }
  } catch (err) {
    // ignore
  }

  // 3. Internal /api/events ingestion
  try {
    const serialized = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", serialized);
    } else {
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: serialized,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (err) {
    // non-blocking
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`%c[Event: ${eventName}]`, "color: #3b82f6; font-weight: bold;", payload);
  }
}

/**
 * Hook to track real-time scroll depth, active scroll duration, and dwell time.
 * Automatically resets when the route or search parameters change.
 */
export function usePageEngagement() {
  const pathname = usePathname();
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetMetrics = useCallback(() => {
    pageStartTime = Date.now();
    lastScrollTimestamp = 0;
    accumulatedScrollMs = 0;
    highestScrollPct = 0;
    currentEngagement = {
      timeOnPageSeconds: 0,
      maxScrollDepthPct: 0,
      scrollDurationSeconds: 0,
    };
  }, []);

  useEffect(() => {
    resetMetrics();

    const calculateMetrics = () => {
      if (typeof window === "undefined") return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      const currentPct = scrollHeight > 0 
        ? Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)))
        : 100;

      if (currentPct > highestScrollPct) {
        highestScrollPct = currentPct;
      }

      const now = Date.now();
      if (lastScrollTimestamp > 0) {
        const delta = now - lastScrollTimestamp;
        // Count active scroll if between 10ms and 1500ms
        if (delta > 10 && delta < 1500) {
          accumulatedScrollMs += delta;
        }
      }
      lastScrollTimestamp = now;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        lastScrollTimestamp = 0;
      }, 1000);

      currentEngagement = {
        timeOnPageSeconds: Math.max(0, Math.round((Date.now() - pageStartTime) / 1000)),
        maxScrollDepthPct: highestScrollPct,
        scrollDurationSeconds: Math.max(0, Math.round(accumulatedScrollMs / 1000)),
      };
    };

    window.addEventListener("scroll", calculateMetrics, { passive: true });
    // Calculate initial depth (e.g. if loaded scrolled or full-height)
    calculateMetrics();

    return () => {
      window.removeEventListener("scroll", calculateMetrics);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [pathname, resetMetrics]);

  const getMetrics = useCallback((): EngagementMetrics => {
    const elapsed = Math.max(0, Math.round((Date.now() - pageStartTime) / 1000));
    return {
      timeOnPageSeconds: elapsed,
      maxScrollDepthPct: highestScrollPct,
      scrollDurationSeconds: Math.max(0, Math.round(accumulatedScrollMs / 1000)),
    };
  }, []);

  return { getMetrics };
}

/**
 * Gets current snapshot of engagement metrics.
 */
export function getCurrentEngagement(): EngagementMetrics {
  const elapsed = pageStartTime > 0 ? Math.max(0, Math.round((Date.now() - pageStartTime) / 1000)) : 0;
  return {
    timeOnPageSeconds: elapsed,
    maxScrollDepthPct: highestScrollPct,
    scrollDurationSeconds: Math.max(0, Math.round(accumulatedScrollMs / 1000)),
  };
}

/**
 * Tracks a WhatsApp click with scroll engagement, dwell time, and contextual intent.
 */
export function trackWhatsAppClick(params: WhatsAppClickPayload) {
  if (typeof window === "undefined") return;

  const metrics = getCurrentEngagement();
  const pathname = window.location.pathname;
  const search = new URLSearchParams(window.location.search);
  const qParam = params.searchQuery || search.get("q") || "";

  // Infer user intent based on page type, query, and scroll depth
  let inferredIntent = params.customIntent || "general_inquiry";
  let pageType = "other";

  if (pathname.startsWith("/products/")) {
    pageType = "pdp";
    // If scrolled past 40%, user viewed the description/specs and likely has a product detail question
    if (metrics.maxScrollDepthPct >= 40) {
      inferredIntent = "product_query_deep_scroll";
    } else {
      // Rapid click without scrolling through details indicates quick pricing/MOQ query
      inferredIntent = "product_quote_quick";
    }
  } else if (pathname === "/shop" || pathname.startsWith("/wholesale")) {
    pageType = "shop";
    if (qParam.trim().length > 0) {
      inferredIntent = "search_unmet_need";
    } else {
      inferredIntent = "catalog_browsing_hesitation";
    }
  } else if (pathname === "/cart" || pathname === "/checkout") {
    pageType = "checkout";
    inferredIntent = "pre_purchase_hesitation";
  } else if (pathname === "/" || pathname === "/sell") {
    pageType = pathname === "/" ? "home" : "sell";
  }

  const eventPayload = {
    event_name: "whatsapp_click",
    session_id: getOrCreateSessionId(),
    location: params.location,
    page_path: pathname,
    page_type: pageType,
    product_id: params.productId || "",
    product_name: params.productName || "",
    category: params.category || "",
    search_query: qParam,
    time_on_page_seconds: metrics.timeOnPageSeconds,
    max_scroll_depth_pct: metrics.maxScrollDepthPct,
    scroll_duration_seconds: metrics.scrollDurationSeconds,
    inferred_intent: inferredIntent,
    ...(params.extra || {}),
  };

  // 1. Dispatch to GA4 via next/third-parties
  try {
    sendGAEvent("event", "whatsapp_click", eventPayload);
  } catch (err) {
    console.warn("GA4 event dispatch error:", err);
  }

  // 2. Dispatch to fallback window.gtag if present
  try {
    if ((window as any).gtag) {
      (window as any).gtag("event", "whatsapp_click", eventPayload);
    }
  } catch (err) {
    // ignore
  }

  // 3. Prepare for internal database events ingestion
  try {
    const serialized = JSON.stringify(eventPayload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", serialized);
    } else {
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: serialized,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (err) {
    // ignore non-blocking endpoint errors
  }

  // 4. Debug output in development
  if (process.env.NODE_ENV !== "production") {
    console.log("%c[WhatsApp Tracking]", "color: #25D366; font-weight: bold;", eventPayload);
  }
}
