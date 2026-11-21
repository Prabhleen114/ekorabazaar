"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Plus, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface RecommendationItem {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  closesGap: boolean;
  newGapAfter: number;
}

interface RecommendationShelfProps {
  cartProductIds: string[];
  gap: number;
  onAddItem: (product: { id: string; title: string; price: number; image?: string }) => void;
  className?: string;
}

export default function RecommendationShelf({
  cartProductIds,
  gap,
  onAddItem,
  className = "",
}: RecommendationShelfProps) {
  const [activeTab, setActiveTab] = useState<"best" | "related">("best");
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRecs = async () => {
      setLoading(true);
      try {
        const ids = cartProductIds.join(",");
        const res = await fetch(`/api/checkout/recommendations?cartProductIds=${encodeURIComponent(ids)}&gap=${gap}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.recommendations) {
            setRecommendations(data.recommendations);
          }
        }
      } catch (e) {
        console.error("Failed to load recommendations:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecs();
    return () => {
      isMounted = false;
    };
  }, [cartProductIds.join(","), gap]);

  const handleScroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const offset = dir === "left" ? -220 : 220;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (!loading && recommendations.length === 0) return null;

  return (
    <div className={`bg-white rounded-xl border border-stone-200 p-3.5 ${className}`}>
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-3">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("best")}
            className={`text-xs font-bold pb-1 transition-colors relative ${
              activeTab === "best"
                ? "text-red-900 border-b-2 border-red-800"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Best offers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("related")}
            className={`text-xs font-bold pb-1 transition-colors relative ${
              activeTab === "related"
                ? "text-red-900 border-b-2 border-red-800"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            You might also like
          </button>
        </div>

        {/* Carousel arrows */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            aria-label="Previous recommendations"
            className="p-1 rounded-full text-stone-500 hover:bg-stone-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            aria-label="Next recommendations"
            className="p-1 rounded-full text-stone-500 hover:bg-stone-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-none scroll-smooth pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {recommendations.map((item) => {
          const discountPct =
            item.originalPrice > item.price
              ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
              : null;

          return (
            <div
              key={item.id}
              className="w-44 shrink-0 border border-stone-200 rounded-lg p-2.5 flex flex-col justify-between bg-stone-50/50 hover:border-red-200 transition-colors group"
            >
              <div>
                {/* Image & Discount Badge */}
                <div className="relative w-full h-28 bg-white rounded-md overflow-hidden mb-2 border border-stone-100">
                  {item.closesGap ? (
                    <div className="absolute top-1.5 left-1.5 z-10 bg-red-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      Unlocks Tier!
                    </div>
                  ) : discountPct && discountPct > 0 ? (
                    <div className="absolute top-1.5 left-1.5 z-10 bg-red-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                      {discountPct}% OFF
                    </div>
                  ) : null}

                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="176px"
                    className="object-contain p-1 group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Title */}
                <h4 className="text-xs font-medium text-stone-800 line-clamp-2 leading-tight mb-1">
                  {item.title}
                </h4>

                {/* Price */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-xs font-bold text-stone-900">
                    ₹{item.price.toLocaleString("en-IN")}
                  </span>
                  {item.originalPrice > item.price && (
                    <span className="text-[10px] text-stone-400 line-through">
                      ₹{item.originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={() =>
                  onAddItem({
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    image: item.image,
                  })
                }
                className="w-full py-1.5 px-2 bg-white hover:bg-red-50 text-red-900 border border-red-800/40 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                ADD
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
