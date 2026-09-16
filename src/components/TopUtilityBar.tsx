"use client";

import Link from "next/link";

export default function TopUtilityBar() {
  return (
    <div className="bg-stone-900 text-stone-100 text-[10px] md:text-[11px] tracking-[0.18em] py-2 px-4 uppercase text-center border-b border-stone-800 font-sans font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="hidden md:block flex-1 text-left text-stone-400 text-[10px] tracking-[0.15em]">
          <span>DIRECT B2B FACTORY SOURCING</span>
        </div>
        <div className="flex-1 text-center">
          <span className="text-stone-200">
            DIRECT FACTORY PRICING &bull; PURE SOY WAX FROM ₹230/KG &bull; IFRA CERTIFIED OILS &bull; DISPATCH IN 24H
          </span>
        </div>
        <div className="hidden md:flex flex-1 justify-end items-center gap-4 text-[10px] text-stone-400">
          <Link href="/sell" className="hover:text-stone-200 transition-colors tracking-widest">
            BECOME A SUPPLIER &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
