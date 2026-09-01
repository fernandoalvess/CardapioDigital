import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.111"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
