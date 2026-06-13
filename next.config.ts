import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    localPatterns: [
      {
        pathname: "/brand/**"
      }
    ]
  },
  async headers() {
    return [
      {
        source: "/track/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store"
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer"
          }
        ]
      },
      {
        source: "/api/tracking/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store"
          }
        ]
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
