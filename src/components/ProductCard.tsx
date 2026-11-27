"use client";
import React from "react";
import Link from "next/link";
import ProductImageClient from "@/components/ProductImageClient";
import { ALL_CATEGORIES } from "@/lib/categories";
import { calculateItemPrice, normalizeTierPriceToRupees, normalizeProductMrpToINR } from "@/lib/pricing";

export type ProductCardItem = {
  id: string;
  title: string;
  category: string | null;
  price: number;
  customerPrice?: number | null;
  mrp?: number | null;
  source?: string | null;
  imageUrl?: string | null;
  wholesaleTiers?: any;
  variants?: any[];
  inStock?: boolean;
  stock?: number;
  isQuoteOnly?: boolean;
};

export default function ProductCard({ product, index = 0, priority = false }: { product: ProductCardItem; index?: number; priority?: boolean }) {
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

  // Guard against missing, zero or invalid prices:
  const isZeroOrMissing =
    product.price == null ||
    isNaN(product.price) ||
    product.price <= 0 ||
    product.isQuoteOnly === true ||
    (product.customerPrice !== undefined && product.customerPrice !== null && product.customerPrice <= 0);

  const unitPriceINR = !isZeroOrMissing
    ? calculateItemPrice(product, 1)
    : 0;

  const isEffectivelyZero = isZeroOrMissing || unitPriceINR <= 0;
  // Central INR convention: unitPriceINR is strictly in Rupees. Never divide an already-rupee amount by 100.
  const rawEffective = unitPriceINR;
  const effectivePriceFormatted = rawEffective >= 1
    ? (rawEffective % 1 === 0 ? rawEffective.toLocaleString('en-IN') : rawEffective.toFixed(2))
    : rawEffective.toFixed(2);
  const mrpINR = normalizeProductMrpToINR(product);
  const showMrp = !isEffectivelyZero && mrpINR !== null && mrpINR > rawEffective;

  // Derive bulk tier price safely:
  let bulkTierPriceFormatted: string | null = null;
  const productTiers = product.wholesaleTiers || product.variants;
  if (!isEffectivelyZero && !hasVariants && product.wholesaleTiers && Array.isArray(product.wholesaleTiers) && product.wholesaleTiers.length > 1) {
    const validTiers = product.wholesaleTiers.filter((t: any) => t && Number(t.price) > 0);
    if (validTiers.length > 1) {
      const lastTier = validTiers[validTiers.length - 1];
      const rawTierPrice = Number(lastTier.price);
      // Unit normalization: safely convert raw tier price to Rupees
      const tierInRupees = normalizeTierPriceToRupees(rawTierPrice, rawEffective);
      if (tierInRupees > 0 && tierInRupees < rawEffective) {
        bulkTierPriceFormatted = tierInRupees >= 1
          ? (tierInRupees % 1 === 0 ? tierInRupees.toLocaleString('en-IN') : tierInRupees.toFixed(2))
          : tierInRupees.toFixed(2);
      }
    }
  }

  const categoryLabel = ALL_CATEGORIES.find(c => c.id === product.category || c.label === product.category)?.label || product.category || "Wholesale Craft Supplies";

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col transition-all duration-300"
    >
      <div className="aspect-[4/5] w-full bg-[#FAF8F5] relative overflow-hidden flex items-center justify-center p-4 sm:p-5 mb-3 border border-stone-200/60">
        <ProductImageClient
          src={product.imageUrl}
          alt={`${product.title} - ${categoryLabel}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          quality={80}
          className="object-cover object-center group-hover:scale-105"
          fallbackSrc="/og-image.jpg"
        />
      </div>

      <div className="flex flex-col flex-1">
        <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono mb-1 line-clamp-1">
          {categoryLabel}
        </span>
        <h3 className="font-sans text-sm md:text-base text-stone-900 font-semibold leading-snug line-clamp-2 min-h-[2.5rem] md:min-h-[2.75rem] mb-2 group-hover:text-[#8C734B] transition-colors">
          {product.title}
        </h3>

        <div className="mt-auto pt-1 flex items-baseline justify-between text-xs font-sans">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {isEffectivelyZero ? (
              <span className="font-semibold text-xs text-stone-600 italic">Price on Request</span>
            ) : (
              <>
                <span className="font-bold text-sm text-stone-950">
                  {hasVariants ? `From ₹${effectivePriceFormatted}` : `₹${effectivePriceFormatted}`}
                </span>
                {showMrp && mrpINR !== null && (
                  <span className="text-[11px] text-stone-400 line-through">
                    ₹{mrpINR.toLocaleString('en-IN')}
                  </span>
                )}
                {bulkTierPriceFormatted && (
                  <span className="text-[10px] text-stone-500">
                    (10+ Bulk: ₹{bulkTierPriceFormatted})
                  </span>
                )}
              </>
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
