import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['http://localhost:3000', 'https://marigold-broken-grading.ngrok-free.dev'],
  images: {
    remotePatterns: [new URL('https://cdn.quatrolympic.com/**')]
  }
};

export default nextConfig;
