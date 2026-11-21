"use client";

import React from "react";
import { Coins, Check } from "lucide-react";

interface EkoraPointsBannerProps {
  pointsEarned: number;
  availableBalance?: number;
  pointsRedeemed?: number;
  onToggleRedeem?: (redeem: boolean) => void;
  className?: string;
}

export default function EkoraPointsBanner({
  pointsEarned,
  availableBalance = 0,
  pointsRedeemed = 0,
  onToggleRedeem,
  className = "",
}: EkoraPointsBannerProps) {
  if (pointsEarned <= 0 && availableBalance <= 0) return null;

  return (
    <div
      className={`border border-dashed border-emerald-400 bg-emerald-50/60 rounded-xl p-3 flex items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
          <Coins className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
            Ekora Points
          </span>
          <p className="text-xs font-semibold text-emerald-950">
            {pointsEarned > 0 && `Earn ${pointsEarned} points cashback on this order`}
            {availableBalance > 0 && pointsEarned <= 0 && `${availableBalance} points available`}
          </p>
        </div>
      </div>

      {availableBalance >= 100 && onToggleRedeem && (
        <button
          type="button"
          onClick={() => onToggleRedeem(pointsRedeemed <= 0)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
            pointsRedeemed > 0
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50"
          }`}
        >
          {pointsRedeemed > 0 ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Redeemed ₹{pointsRedeemed}
            </>
          ) : (
            `Redeem (₹${Math.min(availableBalance, 500)})`
          )}
        </button>
      )}
    </div>
  );
}
