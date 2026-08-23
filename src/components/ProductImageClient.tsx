"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductImageClient({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src || "/og-image.jpg");

  return (
    <Image 
      src={imgSrc} 
      alt={alt} 
      fill
      priority
      unoptimized={true}
      sizes="(max-width: 768px) 100vw, 50vw"
      className="object-cover md:object-contain" 
      onError={() => setImgSrc("/og-image.jpg")}
    />
  );
}
