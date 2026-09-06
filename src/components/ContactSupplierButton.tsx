
"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function ContactSupplierButton({ productName, productId, sellerId }: { productName: string, productId: string, sellerId: string | null }) {
  return (
    <Link 
      href={`https://wa.me/919041500605?text=${encodeURIComponent(`Hi, I'm interested in bulk ordering ${productName} (ID: ${productId})`)}`}
      target="_blank"
      rel="noopener noreferrer" 
      onClick={() => {
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "contact_supplier", {
            item_id: productId,
            supplier_id: sellerId
          });
        }
      }}
      className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-brand-charcoal px-5 py-2.5 rounded-xl font-semibold transition-colors w-full sm:w-auto justify-center"
    >
      <MessageCircle className="w-4 h-4" /> Send Enquiry
    </Link>
  );
}

