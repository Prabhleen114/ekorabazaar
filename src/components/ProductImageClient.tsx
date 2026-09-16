"use client";

import Image from "next/image";
import { useState } from "react";

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

  return (
    <Image 
      src={imgSrc} 
      alt={alt} 
      fill
      priority={priority}
      quality={85}
      sizes={sizes}
      className={className} 
      onError={() => setImgSrc("/placeholder-product.svg")}
    />
  );
}
