import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  allowedDevOrigins: ['http://localhost:3000', 'https://marigold-broken-grading.ngrok-free.dev'],
  images: {
    remotePatterns: [new URL('https://cdn.quatrolympic.com/**')]
  },
  experimental: {
    serverActions: {
    bodySizeLimit: '10mb',
  },
  }
};

export default nextConfig;
