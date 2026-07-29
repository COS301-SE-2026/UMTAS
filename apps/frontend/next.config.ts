import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const target = process.env.API_URL || "http://backend:8003";
    console.log(
      "[next.config] API_URL =",
      process.env.API_URL,
      "target =",
      target,
    );
    return [
      {
        source: "/api/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
