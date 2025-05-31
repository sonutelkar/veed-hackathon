import type { NextConfig } from "next";

const nextConfig : NextConfig = {
  experimental: { },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fal.ai' },
    ],
  },
};
module.exports = nextConfig;
