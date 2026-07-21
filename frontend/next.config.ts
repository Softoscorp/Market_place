import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    // Disable PWA service worker in production build to avoid Turbopack conflict
  },
};

export default nextConfig;
