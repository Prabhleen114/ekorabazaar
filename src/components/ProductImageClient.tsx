"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function ProductImageClient({ 
  src, 
  alt,
  className = "object-contain p-2 md:p-4",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false
}: { 
  src: string; 
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [imgSrc, setImgSrc] = useState(src || "/placeholder-product.svg");

  useEffect(() => {
    setImgSrc(src || "/placeholder-product.svg");
  }, [src]);

  return (
    <Image 
      src={imgSrc} 
      alt={alt} 
      fill
      unoptimized={Boolean(imgSrc && imgSrc.startsWith("http"))}
      priority={priority}
      quality={85}
      sizes={sizes}
      className={className} 
      onError={() => setImgSrc("/placeholder-product.svg")}
    />
  );
}
