"use client";
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
  
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col transition-all duration-300"
    >
      <div className="aspect-[4/5] w-full bg-[#FAF8F5] relative overflow-hidden flex items-center justify-center p-4 sm:p-5 mb-3 border border-stone-200/60">
        <Image
          src={product.imageUrl || "/og-image.jpg"}
          alt={product.title}
          fill
          unoptimized={isExternalImage}
          quality={95}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading={index < 8 ? "eager" : "lazy"}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = "/og-image.jpg";
            target.srcset = "";
          }}
        />
      </div>

      <div className="flex flex-col flex-1">
        <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono mb-1 line-clamp-1">
          {product.category || "Studio Raw Material"}
        </span>
        <h3 className="font-serif text-sm md:text-base text-stone-900 font-normal leading-snug line-clamp-2 min-h-[2.5rem] md:min-h-[2.75rem] mb-2 group-hover:text-[#8C734B] transition-colors">
          {product.title}
        </h3>
        
        <div className="mt-auto pt-1 flex items-baseline justify-between text-xs font-mono">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-stone-950">₹{effectivePrice}</span>
            {product.wholesaleTiers && Array.isArray(product.wholesaleTiers) && product.wholesaleTiers.length > 1 && (
              <span className="text-[10px] text-stone-500">
                (From ₹{Math.round((product.wholesaleTiers[product.wholesaleTiers.length - 1].price || 0) / 100)})
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors">
            View &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
