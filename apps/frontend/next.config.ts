import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/auth",
        destination: `${process.env.API_URL || "http://localhost:3000"}/api/auth`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${process.env.API_URL || "http://localhost:3000"}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
