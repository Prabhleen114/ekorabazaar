"use client";

import Link from "next/link";
import { ArrowRight, Truck } from "lucide-react";

export default function TopUtilityBar() {
  return (
    <div className="bg-brand-charcoal text-white/90 text-xs py-2 px-6 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-brand-orange" />
          <span className="font-medium">Free Shipping across India on orders above ₹2,000</span>
        </div>
        <div className="flex items-center gap-6">
          <Link 
            href="/sell" 
            className="hover:text-brand-orange transition-colors font-medium flex items-center gap-1 group"
          >
            <span>Are you a Supplier or Brand? <strong className="text-white group-hover:text-brand-orange underline">Become a Seller</strong></span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
