import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const target = process.env.API_URL || "http://backend:8003";
    console.log(
      "[next.config] API_URL =",
      process.env.API_URL,
      "→ target =",
      target,
    );
    return [
      {
        source: "/api/auth",
        destination: `${target}/api/auth`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${target}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
