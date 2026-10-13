import type { NextConfig } from "next";

 const nextConfig: NextConfig = {
  output: "export",
  basePath: "/learningpack",
  assetPrefix: "/learningpack",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
