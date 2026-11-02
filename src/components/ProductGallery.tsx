"use client";

import { useState, useRef, useEffect } from "react";
import ProductImageClient from "@/components/ProductImageClient";

interface Props {
  mainImage: string;
  images?: string[];
  productName: string;
  category?: string;
}

export default function ProductGallery({ mainImage, images: propImages, productName, category = "" }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedDesktopIndex, setSelectedDesktopIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Gallery slides: primary product image + contextual bottle/label verification shot if cosmetic/scent/wax
  const isBottleItem = category.toLowerCase().includes("fragrance") || 
                       category.toLowerCase().includes("essential") || 
                       category.toLowerCase().includes("oil") || 
                       category.toLowerCase().includes("hydrosol");

  const slideImages: { src: string; label: string }[] = (propImages && propImages.length > 0)
    ? propImages.map((src, idx) => {
        let label = idx === 0 ? "Main View" : `View ${idx + 1}`;
        const lower = src.toLowerCase();
        if (lower.includes("peony")) label = "Peony Mould (3380A)";
        else if (lower.includes("chamomile")) label = "Chamomile Mould (J-5598)";
        else if (lower.includes("camellia")) label = "Camellia Mould (J-5599)";
        else if (lower.includes("bouquet")) label = "Finished Candles Bouquet";
        else if (lower.includes("set")) label = "3-Flower Set Overview";
        else if (lower.includes("dimensions")) label = "Mould Dimensions";
        return { src, label };
      })
    : [
        { src: mainImage, label: "Studio Product" },
        ...(isBottleItem ? [{ src: "/images/base-bottle.webp", label: "Real Bottle & Label" }] : [])
      ];

  // Listen to variant selection changes from PricingWidget to automatically focus corresponding slide
  useEffect(() => {
    const handleVariantChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ variant?: { image?: string; size?: string } }>;
      const v = customEvent.detail?.variant;
      if (!v) return;

      let targetIdx = -1;
      if (v.image) {
        targetIdx = slideImages.findIndex(img => img.src === v.image);
      }
      if (targetIdx === -1 && v.size) {
        const query = v.size.toLowerCase();
        targetIdx = slideImages.findIndex(img => 
          img.label.toLowerCase().includes(query) || 
          img.src.toLowerCase().includes(query.split(" ")[0].toLowerCase())
        );
      }

      if (targetIdx >= 0) {
        setSelectedDesktopIndex(targetIdx);
        setActiveIndex(targetIdx);
        if (scrollRef.current) {
          const width = scrollRef.current.offsetWidth;
          scrollRef.current.scrollTo({ left: targetIdx * width, behavior: "smooth" });
        }
      }
    };

    window.addEventListener("product:variant-change", handleVariantChange);
    return () => window.removeEventListener("product:variant-change", handleVariantChange);
  }, [slideImages]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.offsetWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      setActiveIndex(newIndex);
    }
  };

  return (
    <div className="w-full">
      {/* Mobile Swipeable Gallery (aspect-[4/5] with snap and dot indicators) */}
      <div className="md:hidden relative w-full">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="w-full aspect-[4/5] overflow-x-auto snap-x snap-mandatory flex no-scrollbar bg-stone-50 border border-stone-200/90 relative"
        >
          {slideImages.map((img, idx) => (
            <div
              key={idx}
              className="w-full h-full shrink-0 snap-center relative flex items-center justify-center p-6"
            >
              <ProductImageClient
                src={img.src}
                alt={`${productName} - ${img.label}`}
                priority={idx === 0}
                quality={90}
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-contain"
              />
            </div>
          ))}
        </div>

        {/* Swipe Dot Indicators */}
        {slideImages.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center items-center gap-1.5 z-10">
            {slideImages.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  activeIndex === idx ? "w-5 bg-stone-900" : "w-1.5 bg-stone-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Gallery (Sticky Architectural Framing) */}
      <div className="hidden md:block md:sticky md:top-24">
        <div className="aspect-[4/5] w-full bg-stone-50/50 border border-stone-200/80 flex items-center justify-center p-8 overflow-hidden relative">
          <ProductImageClient
            src={slideImages[selectedDesktopIndex]?.src || mainImage}
            alt={`${productName} - ${slideImages[selectedDesktopIndex]?.label || "Product"}`}
            priority={true}
            quality={95}
            sizes="50vw"
            fallbackSrc="/placeholder-product.svg"
          />
        </div>

        {/* Desktop Thumbnails if multiple images exist */}
        {slideImages.length > 1 && (
          <div className="flex items-center gap-3 mt-3 overflow-x-auto pb-1">
            {slideImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDesktopIndex(idx)}
                className={`relative w-16 h-20 shrink-0 border overflow-hidden rounded-xs transition-all cursor-pointer ${
                  selectedDesktopIndex === idx
                    ? "border-stone-900 ring-1 ring-stone-900 shadow-xs"
                    : "border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100"
                }`}
                title={img.label}
              >
                <ProductImageClient
                  src={img.src}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
