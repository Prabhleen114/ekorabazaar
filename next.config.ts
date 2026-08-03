import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "jindeal.com",
      },
      {
        protocol: "https",
        hostname: "www.ekorabazaar.in",
      },
    ],
  },
};

export default nextConfig;
