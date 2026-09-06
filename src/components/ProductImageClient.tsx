"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductImageClient({ 
  src, 
  alt,
  className = "object-cover md:object-contain",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false
}: { 
  src: string; 
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [imgSrc, setImgSrc] = useState(src || "/og-image.jpg");

  return (
    <Image 
      src={imgSrc} 
      alt={alt} 
      fill
      priority={priority}
      unoptimized={true}
      sizes={sizes}
      className={className} 
      onError={() => setImgSrc("/og-image.jpg")}
    />
  );
}
