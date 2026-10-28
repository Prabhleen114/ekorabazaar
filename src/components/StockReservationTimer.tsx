"use client";

import { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";

interface StockReservationTimerProps {
  variant?: "compact" | "banner";
  className?: string;
}

const STORAGE_KEY = "ekora_stock_hold_expiry";
const HOLD_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export default function StockReservationTimer({
  variant = "banner",
  className = "",
}: StockReservationTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let expiry = 0;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        expiry = parseInt(stored, 10);
      }
      // If no valid future timestamp, start a fresh 15-min countdown
      if (!expiry || isNaN(expiry) || expiry <= Date.now()) {
        expiry = Date.now() + HOLD_DURATION_MS;
        sessionStorage.setItem(STORAGE_KEY, expiry.toString());
      }
    } catch {
      expiry = Date.now() + HOLD_DURATION_MS;
    }

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setSecondsRemaining(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (!mounted) {
    // Avoid hydration mismatch by rendering default skeleton
    return null;
  }

  const isExpiringSoon = secondsRemaining > 0 && secondsRemaining <= 180; // under 3 mins
  const isExpired = secondsRemaining === 0;

  if (variant === "compact") {
    return (
      <div
        className={`bg-amber-50/90 border border-amber-200/90 rounded-xl px-3 py-2 text-stone-800 ${className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isExpired ? "bg-red-400" : "bg-amber-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isExpired ? "bg-red-500" : "bg-amber-600"
                }`}
              />
            </span>
            <p className="text-xs font-semibold text-stone-900 truncate">
              {isExpired ? "Stock release imminent" : "Factory Stock Hold"}
            </p>
          </div>
          <div
            className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
              isExpired
                ? "bg-red-100 text-red-800"
                : isExpiringSoon
                ? "bg-red-100 text-red-700 animate-pulse"
                : "bg-amber-100/90 text-amber-900"
            }`}
          >
            {timeFormatted}
          </div>
        </div>
        <p className="text-[11px] text-stone-600 leading-snug mt-1">
          {isExpired
            ? "Hold time finish ho gaya hai — abhi order confirm karein taaki stock cancel na ho."
            : "Aapka stock hold par hai. Order karein taaki aaj hi Muzaffarpur factory se direct dispatch ho sake."}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-linear-to-r from-amber-50 via-orange-50/40 to-amber-50/60 border border-amber-200/90 rounded-2xl p-4 text-stone-900 shadow-xs ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isExpired
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-sans font-bold text-sm text-stone-900">
                {isExpired ? "Factory Stock Hold Expired" : "Factory Stock Reserved"}
              </h4>
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isExpired ? "bg-red-400" : "bg-amber-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isExpired ? "bg-red-500" : "bg-amber-600"
                  }`}
                />
              </span>
            </div>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Direct Wholesale Godown &bull; 24-Hour Dispatch
            </p>
          </div>
        </div>

        <div
          className={`font-mono text-sm md:text-base font-bold px-3 py-1 rounded-lg shrink-0 border ${
            isExpired
              ? "bg-red-100 text-red-800 border-red-200"
              : isExpiringSoon
              ? "bg-red-100 text-red-700 border-red-200 animate-pulse"
              : "bg-amber-100 text-amber-900 border-amber-200"
          }`}
        >
          {timeFormatted}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-amber-200/60">
        <p className="text-xs md:text-sm text-stone-700 font-sans leading-relaxed">
          {isExpired ? (
            <span className="text-red-700 font-medium">
              15 minute ka hold time poora ho chuka hai. Agar aapka cart kisi aur maker ne book kar liya toh stock khatam ho sakta hai. Abhi complete karein!
            </span>
          ) : (
            <>
              <strong>Aapka raw material stock 15 minute ke liye hold par hai.</strong>{" "}
              Order complete karein taaki aaj hi factory godown se direct dispatch ho sake aur stock release na ho.
            </>
          )}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-sans text-stone-600">
          <span className="inline-flex items-center gap-1 bg-white/90 border border-stone-200/80 px-2 py-0.5 rounded-md">
            📦 Direct Factory Stock
          </span>
          <span className="inline-flex items-center gap-1 bg-white/90 border border-stone-200/80 px-2 py-0.5 rounded-md">
            ⚡ 24h Express Dispatch
          </span>
          <span className="inline-flex items-center gap-1 bg-white/90 border border-stone-200/80 px-2 py-0.5 rounded-md">
            🚚 Flat ₹90 Shipping
          </span>
        </div>
      </div>
    </div>
  );
}
