import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "jindeal.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "www.ekorabazaar.in" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "naumenterprises.com" },
      { protocol: "https", hostname: "soapytwist.com" },
      { protocol: "https", hostname: "*.imimg.com" },
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "*.media-amazon.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/images/:path*.png",
        destination: "/images/:path*.webp",
      },
    ];
  },
};

export default nextConfig;
