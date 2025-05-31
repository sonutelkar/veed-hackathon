import type { NextConfig } from "next";

const nextConfig : NextConfig = {
  experimental: { serverActions: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.photoroom.com' },
      { protocol: 'https', hostname: '**.fal.ai' },
    ],
  },
};
module.exports = nextConfig;
