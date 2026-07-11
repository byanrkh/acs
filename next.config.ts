import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['localhost:3000'],
  images: {
    remotePatterns: [new URL('https://cdn.quatrolympic.com/**')]
  }
};

export default nextConfig;
