import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
];

const cacheImmutable = "public, max-age=31536000, immutable";
const cacheDay = "public, max-age=86400, stale-while-revalidate=604800";
const cacheHour = "public, max-age=3600, stale-while-revalidate=86400";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.148"],
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/app",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: cacheImmutable }],
      },
      {
        source: "/_next/image",
        headers: [{ key: "Cache-Control", value: cacheDay }],
      },
      {
        source: "/landing/:path*",
        headers: [{ key: "Cache-Control", value: cacheDay }],
      },
      {
        source: "/icon.svg",
        headers: [{ key: "Cache-Control", value: cacheDay }],
      },
      {
        source: "/apple-icon",
        headers: [{ key: "Cache-Control", value: cacheDay }],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: cacheDay }],
      },
      {
        source: "/robots.txt",
        headers: [{ key: "Cache-Control", value: cacheDay }],
      },
      {
        source: "/sitemap.xml",
        headers: [{ key: "Cache-Control", value: cacheDay }],
      },
      {
        source: "/:path*opengraph-image",
        headers: [{ key: "Cache-Control", value: cacheHour }],
      },
    ];
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
