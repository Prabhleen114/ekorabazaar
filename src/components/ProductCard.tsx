import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Tag } from "lucide-react";

type Product = {
  id: string;
  title: string;
  category: string | null;
  price: number;
  imageUrl?: string | null;
  wholesaleTiers?: any;
};

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const isExternalImage = Boolean(product.imageUrl && product.imageUrl.startsWith("http"));
  const effectivePrice = product.price / 100;
  
  // Check if bulk discount is available
  const bulkDiscountAvailable = Array.isArray(product.wholesaleTiers) && product.wholesaleTiers.length > 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-brand-linen hover:border-brand-orange/40 hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className="aspect-square bg-brand-bg relative flex items-center justify-center overflow-hidden">
        <Image
          src={product.imageUrl || "/og-image.jpg"}
          alt={product.title}
          fill
          unoptimized={isExternalImage}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          loading={index < 8 ? "eager" : "lazy"}
        />
        {bulkDiscountAvailable && (
          <div className="absolute top-3 left-3 bg-brand-orange text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
            <Tag className="w-3 h-3" /> Bulk Discount
          </div>
        )}
      </div>
      <div className="p-3 md:p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40 line-clamp-1">
            {product.category}
          </span>
        </div>
        <h3 className="font-serif font-bold text-sm md:text-base text-brand-charcoal mb-auto line-clamp-2 leading-snug">
          {product.title}
        </h3>
        
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-brand-linen flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-charcoal/40 uppercase tracking-wider block mb-0.5">
              From
            </span>
            <span className="font-bold text-brand-charcoal text-sm md:text-base">
              ₹{effectivePrice}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
