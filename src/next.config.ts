import type { NextConfig } from "next";

const nextConfig : NextConfig = {
  experimental: { },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fal.ai' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};
module.exports = nextConfig;
