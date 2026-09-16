import React from "react";
import Link from "next/link";
import Image from "next/image";

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
  
  // Check if bulk discount tier is available
  const bulkDiscountAvailable = Array.isArray(product.wholesaleTiers) && product.wholesaleTiers.length > 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white border border-stone-200/80 hover:border-stone-400 transition-all duration-300 flex flex-col"
    >
      <div className="aspect-[4/5] bg-stone-50/60 relative flex items-center justify-center p-4 overflow-hidden border-b border-stone-200/40">
        <Image
          src={product.imageUrl || "/og-image.jpg"}
          alt={product.title}
          fill
          unoptimized={isExternalImage}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-700 ease-out"
          loading={index < 8 ? "eager" : "lazy"}
        />
        {bulkDiscountAvailable && (
          <div className="absolute top-2.5 left-2.5 border border-stone-300 text-[9px] uppercase tracking-widest px-2 py-0.5 text-stone-600 bg-white/90 backdrop-blur-xs font-mono">
            Tier Available
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-mono line-clamp-1 block mb-1">
            {product.category || "Studio Raw Material"}
          </span>
          <h3 className="font-serif text-sm md:text-base text-stone-900 line-clamp-1 font-normal tracking-tight group-hover:text-[#8C734B] transition-colors">
            {product.title}
          </h3>
        </div>
        
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
          <span className="text-sm font-medium text-stone-900 font-mono">
            ₹{effectivePrice}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors font-mono">
            VIEW &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
