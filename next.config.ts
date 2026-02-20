import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  assetPrefix: 'https://nutriunai.unaividal.com',
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
