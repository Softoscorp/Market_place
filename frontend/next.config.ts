/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  experimental: {
    // Disable PWA service worker in production build to avoid Turbopack conflict
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
