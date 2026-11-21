"use client";

import React from "react";
import { Check, Percent, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { TierRewardProgress } from "@/lib/pricing/pricing-engine";

interface TierProgressBarProps {
  progress?: TierRewardProgress | null;
  className?: string;
}

export default function TierProgressBar({ progress, className = "" }: TierProgressBarProps) {
  const defaultProgress: TierRewardProgress = {
    eligibleSubtotal: 0,
    unlocked: [],
    next: {
      min: 5000,
      gap: 5000,
      reward: "5% OFF + Free Gift",
      savingIfReached: 250,
      discountPercent: 5,
      giftSku: "GIFT_A",
      tierId: 1,
    },
    after: {
      min: 10000,
      gap: 10000,
      reward: "7% OFF + Free Gift",
      discountPercent: 7,
      giftSku: "GIFT_B",
      tierId: 2,
    },
  };

  const activeProgress = progress || defaultProgress;
  const current = activeProgress.eligibleSubtotal || 0;
  const tiers = [
    { min: 5000, label: "5% OFF + Gift", pct: 5, sku: "GIFT_A" },
    { min: 10000, label: "7% OFF + Gift", pct: 7, sku: "GIFT_B" },
  ];

  const maxVal = tiers[tiers.length - 1].min;
  const fillPercentage = Math.min(100, Math.max(0, (current / maxVal) * 100));

  // Determine encouragement message
  let headline = "";
  if (activeProgress.next) {
    headline = `Add items worth ₹${activeProgress.next.gap.toLocaleString("en-IN")} to avail flat ${activeProgress.next.reward}!`;
  } else if (activeProgress.unlocked.length > 0) {
    headline = "🎉 Maximum tier unlocked! You've qualified for the top reward!";
  } else {
    headline = "Add items to unlock exclusive milestone discounts and free gifts!";
  }

  return (
    <div
      className={`bg-white rounded-xl p-3 shadow-2xs border border-red-100 ${className}`}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={maxVal}
      aria-label="Milestone Rewards Progress"
    >
      {/* Dynamic Headline */}
      <div className="text-center mb-2.5">
        <p className="text-xs font-semibold text-stone-900 tracking-tight">
          {headline}
        </p>
        {activeProgress.next && activeProgress.next.savingIfReached > 0 && (
          <p className="text-[10px] text-red-700 font-medium mt-0.5">
            You will save up to ₹{activeProgress.next.savingIfReached} + get a Free Gift!
          </p>
        )}
      </div>

      {/* Track & Milestones */}
      <div className="relative px-6 pt-1 pb-1">
        {/* Background Rail */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-stone-200 rounded-full -translate-y-1/2 z-0" />

        {/* Animated Filled Track */}
        <motion.div
          className="absolute top-5 left-8 h-1 bg-gradient-to-r from-red-600 to-rose-700 rounded-full -translate-y-1/2 z-0"
          initial={{ width: 0 }}
          animate={{ width: `calc((100% - 4rem) * ${fillPercentage / 100})` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* Milestone Markers */}
        <div className="relative flex justify-between items-center z-10">
          {tiers.map((tier) => {
            const isUnlocked = current >= tier.min;
            return (
              <div key={tier.min} className="flex flex-col items-center">
                {/* Badge Node */}
                <motion.div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-2xs ${
                    isUnlocked
                      ? "bg-red-800 text-white ring-2 ring-red-200"
                      : "bg-white border border-stone-300 text-stone-400"
                  }`}
                  animate={{ scale: isUnlocked ? [1, 1.12, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {isUnlocked ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <Percent className="w-3 h-3" />
                  )}
                </motion.div>

                {/* Amount & Reward Description */}
                <div className="text-center mt-1">
                  <span
                    className={`block text-[10px] font-bold leading-tight transition-colors ${
                      isUnlocked ? "text-red-900" : "text-stone-600"
                    }`}
                  >
                    ₹{tier.min.toLocaleString("en-IN")}
                  </span>
                  <span
                    className={`block text-[9px] font-medium leading-tight transition-colors ${
                      isUnlocked ? "text-red-800" : "text-stone-500"
                    }`}
                  >
                    {tier.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
