"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const ANNOUNCEMENTS = [
  {
    text: "SOY WAX AT 250RS PER KG",
    href: "/shop?q=soy+wax",
  },
  {
    text: "99% PURE ETHANOL FOR PERFUMERY AT JUST 350RS PER LITRE",
    href: "/shop?q=ethanol",
  },
  {
    text: "99% HEAVYMETAL TESTED GYPSUM POWDER AT JUST 110RS PER KG",
    href: "/shop?q=gypsum",
  },
  {
    text: "MOULDS STARTING AT JUST ₹71",
    href: "/shop?category=General+Silicone+Moulds",
  },
];

export default function TopUtilityBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Smoothly fade out current text
      setIsVisible(false);

      // 2. Swap text and slide in next offer
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const current = ANNOUNCEMENTS[currentIndex];

  return (
    <div className="h-9 bg-[#181715] text-[#FAF8F5] flex items-center justify-center text-[11px] tracking-[0.2em] uppercase font-mono px-4 border-b border-stone-800 select-none">
      <div className="max-w-[1400px] w-full mx-auto flex items-center justify-between">
        <div className="hidden lg:block flex-1 text-left text-stone-400 text-[10px] tracking-[0.15em]">
          DIRECT B2B FACTORY SOURCING
        </div>

        {/* Dynamic Rotating Announcements */}
        <div className="flex-1 text-center relative h-6 flex items-center justify-center overflow-hidden">
          <div
            className={`flex items-center justify-center gap-2 truncate px-2 transition-all duration-300 ease-in-out transform ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2.5 pointer-events-none"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <Link
              href={current.href}
              className="hover:text-amber-400 transition-colors truncate"
              title="Click to view wholesale inventory"
            >
              {current.text}
            </Link>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 justify-end items-center gap-4 text-[10px] text-stone-400">
          <Link href="/sell" className="hover:text-stone-200 transition-colors tracking-widest">
            BECOME A SUPPLIER &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
