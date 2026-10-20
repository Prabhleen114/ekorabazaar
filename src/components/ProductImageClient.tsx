"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export interface ProductImageClientProps {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  fallbackSrc?: string;
  unoptimized?: boolean;
}

export default function ProductImageClient({
  src,
  alt,
  className = "object-contain p-2 md:p-4",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  quality = 85,
  fallbackSrc = "/og-image.jpg",
  unoptimized,
}: ProductImageClientProps) {
  const defaultFallback = fallbackSrc || "/og-image.jpg";
  const initialSrc = src || defaultFallback;
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const nextSrc = src || defaultFallback;
    setImgSrc(nextSrc);
    setIsLoaded(false);
  }, [src, defaultFallback]);

  const isExternal = Boolean(imgSrc && (imgSrc.startsWith("http://") || imgSrc.startsWith("https://")));
  const shouldBeUnoptimized = typeof unoptimized === "boolean" ? unoptimized : isExternal;

  return (
    <Image
      ref={(node) => {
        if (node && node.complete && node.naturalWidth > 0 && !isLoaded) {
          setIsLoaded(true);
        }
      }}
      src={imgSrc}
      alt={alt}
      fill
      unoptimized={shouldBeUnoptimized}
      priority={priority}
      quality={quality}
      sizes={sizes}
      className={`transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
        isLoaded ? "opacity-100" : "opacity-0"
      } ${className}`}
      onLoad={() => setIsLoaded(true)}
      onError={() => {
        if (imgSrc !== defaultFallback) {
          setImgSrc(defaultFallback);
        }
        setIsLoaded(true);
      }}
    />
  );
}
