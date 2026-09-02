import type { NextConfig } from "next";

const cspHeader = [
  "default-src 'self'",
  `script-src 'self' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""}`,
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
    ];
  },
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
