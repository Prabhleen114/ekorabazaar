"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  initCITracker,
  trackPageView,
  trackCoaClick,
  trackWhatsAppClick,
  flushCIQueue,
} from "@/lib/ci-tracker";

export default function CITracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    initCITracker();
  }, []);

  // Track page_view on pathname transition
  useEffect(() => {
    if (!pathname) return;
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      trackPageView(pathname);
    }
  }, [pathname]);

  // Global event delegation for click tracking (COA links, WhatsApp clicks)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a, button");
      if (!target) return;

      const href = target.getAttribute("href") || "";
      const text = (target.textContent || "").toLowerCase();

      // Detect WhatsApp clicks
      if (href.includes("wa.me") || href.includes("api.whatsapp.com")) {
        let location = "unknown";
        if (target.closest("[data-whatsapp-location]")) {
          location = target.closest("[data-whatsapp-location]")?.getAttribute("data-whatsapp-location") || "custom";
        } else if (target.closest("footer")) {
          location = "footer";
        } else if (target.closest("header") || target.closest("nav")) {
          location = "header";
        } else if (target.classList.contains("fixed") || target.closest(".fixed")) {
          location = "floating";
        } else {
          location = "inline_cta";
        }

        const productId = target.getAttribute("data-product-id") || undefined;
        trackWhatsAppClick(location, productId);
      }

      // Detect COA / Batch Report clicks
      if (
        href.includes("coa") ||
        href.includes("batch-report") ||
        href.includes("certificate") ||
        text.includes("coa") ||
        text.includes("batch report") ||
        text.includes("lab report")
      ) {
        const productId = target.getAttribute("data-product-id") || undefined;
        trackCoaClick(productId || "unknown", href);
      }
    };

    document.addEventListener("click", handleDocumentClick, { passive: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  return null;
}
