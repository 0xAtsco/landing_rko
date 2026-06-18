import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/landing-rko/video/:path*",
        destination: "/video/:path*",
      },
    ];
  },
};

export default nextConfig;
