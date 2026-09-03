import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Images are optimized once when they are uploaded, then served directly
    // from static/Supabase storage. This prevents Vercel's on-demand Image
    // Optimization service from generating billable transformations.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "oassmkyfcomqkhouyzmi.supabase.co",
      },
    ],
  },
};

export default nextConfig;
