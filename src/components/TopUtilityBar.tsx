"use client";

import Link from "next/link";

export default function TopUtilityBar() {
  return (
    <div className="h-9 bg-[#181715] text-[#FAF8F5] flex items-center justify-center text-[11px] tracking-[0.2em] uppercase font-mono px-4 border-b border-stone-800">
      <div className="max-w-[1400px] w-full mx-auto flex items-center justify-between">
        <div className="hidden lg:block flex-1 text-left text-stone-400 text-[10px] tracking-[0.15em]">
          DIRECT B2B FACTORY SOURCING
        </div>
        <div className="flex-1 text-center truncate">
          <span>
            DIRECT FACTORY PRICING &bull; PURE SOY WAX FROM ₹230/KG &bull; IFRA CERTIFIED OILS &bull; DISPATCH IN 24H
          </span>
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
