import type { NextConfig } from "next";

// Product covers live on a host that sends no CORS headers, so WebGL cannot
// read them directly. The 3D bookshop fetches them through this same-origin
// path instead (see components/learning-pack-3d/src/api.js → coverUrl()).
const COVER_ORIGIN = process.env.LP_COVER_ORIGIN || "https://image.codingclubskenya.com";

const nextConfig: NextConfig = {
  // Static export drops rewrites, so only export for production builds; `next dev` keeps /lp-cover working.
  ...(process.env.NODE_ENV === "production" ? { output: "export" as const } : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [{ source: "/lp-cover/:path*", destination: `${COVER_ORIGIN}/:path*` }];
  },
};

export default nextConfig;
