import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://nutriunai.unaividal.com' 
    : undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nutriunai.unaividal.com',
      },
    ],
  },
};

export default nextConfig;
