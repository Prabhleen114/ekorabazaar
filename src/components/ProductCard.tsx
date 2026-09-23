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
          quality={85}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading={index < 8 ? "eager" : "lazy"}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = "/og-image.jpg";
            target.srcset = "";
          }}
        />
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-mono mb-1 truncate">
          {product.category || "Studio Raw Material"}
        </span>
        <h3 className="font-serif text-sm md:text-base text-stone-900 font-normal leading-snug line-clamp-1 mb-1.5 group-hover:text-[#8C734B] transition-colors">
          {product.title}
        </h3>
        <div className="text-xs font-light text-stone-700 flex items-center justify-between font-mono">
          <span>₹{effectivePrice}</span>
          <span className="text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors">
            View &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
