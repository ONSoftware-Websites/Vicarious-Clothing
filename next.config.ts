import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: [
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
      {key:"X-Frame-Options",value:"DENY"},
      {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
    ]}];
  },
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
