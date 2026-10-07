"use client";

import { useEffect, useRef } from "react";

export function HesitationTracker() {
  const hoverTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const scrollHistory = useRef<number[]>([]);

  useEffect(() => {
    // 1. Track text highlights
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 10) {
        const text = selection.toString();
        // Simple heuristic: if it looks like policy/shipping text
        if (/return|refund|shipping|delivery|days/i.test(text)) {
          trackHesitationEvent("policy_highlight", { textSnippet: text.substring(0, 50) });
        }
      }
    };
    document.addEventListener("selectionchange", handleSelection);

    // 2. Track hover intent over CTAs and Prices
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest(".price") || target.closest("[data-cta]")) {
        const id = target.id || target.className;
        hoverTimers.current[id] = setTimeout(() => {
          trackHesitationEvent("long_hover", { element: id, duration: "3s+" });
        }, 3000);
      }
    };
    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest(".price") || target.closest("[data-cta]")) {
        const id = target.id || target.className;
        if (hoverTimers.current[id]) {
          clearTimeout(hoverTimers.current[id]);
          delete hoverTimers.current[id];
        }
      }
    };
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    // 3. Track scroll thrashing
    const handleScroll = () => {
      const now = Date.now();
      scrollHistory.current.push(now);
      
      // Clean up old scroll events (> 5s ago)
      scrollHistory.current = scrollHistory.current.filter((time) => now - time < 5000);

      // If more than 15 scroll events in 5 seconds, flag as thrashing
      if (scrollHistory.current.length > 15) {
        trackHesitationEvent("scroll_thrashing", { count: scrollHistory.current.length });
        scrollHistory.current = []; // Reset to prevent spam
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("selectionchange", handleSelection);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const trackHesitationEvent = async (type: string, data: any) => {
    try {
      await fetch("/api/intelligence/track-hesitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data, url: window.location.pathname }),
      });
    } catch (e) {
      console.error("Failed to track hesitation", e);
    }
  };

  return null;
}
