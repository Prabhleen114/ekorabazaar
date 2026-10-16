import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "jindeal.com" },
      { protocol: "https", hostname: "*.jindeal.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "*.myshopify.com" },
      { protocol: "https", hostname: "www.ekorabazaar.in" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "naumenterprises.com" },
      { protocol: "https", hostname: "soapytwist.com" },
      { protocol: "https", hostname: "*.soapytwist.com" },
      { protocol: "https", hostname: "*.imimg.com" },
      { protocol: "https", hostname: "5.imimg.com" },
      { protocol: "https", hostname: "matinimpex.com" },
      { protocol: "https", hostname: "*.matinimpex.com" },
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
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
  async redirects() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/sitemap_index.xml",
        permanent: true,
      },
      // Confirmed duplicate product redirects to canonical SKUs
      { source: "/products/399", destination: "/products/375", permanent: true },
      { source: "/products/2383", destination: "/products/854", permanent: true },
      { source: "/products/2385", destination: "/products/857", permanent: true },
      { source: "/products/2390", destination: "/products/862", permanent: true },
      { source: "/products/2388", destination: "/products/932", permanent: true },
      { source: "/products/2401", destination: "/products/1262", permanent: true },
      { source: "/products/2399", destination: "/products/1283", permanent: true },
      { source: "/products/2403", destination: "/products/1285", permanent: true },
    ];
  }
};

export default nextConfig;
