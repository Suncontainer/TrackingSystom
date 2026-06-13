import type { NextConfig } from "next";

function buildCsp() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sentryDsn = process.env.SENTRY_DSN;
  const connectSources = [
    "'self'",
    supabaseUrl ? new URL(supabaseUrl).origin : null,
    sentryDsn ? new URL(sentryDsn).origin : null,
    process.env.UPSTASH_REDIS_REST_URL ? new URL(process.env.UPSTASH_REDIS_REST_URL).origin : null
  ].filter(Boolean);
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
    `connect-src ${connectSources.join(" ")}`,
    "frame-src https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests"
  ];

  return directives.join("; ");
}

function globalSecurityHeaders() {
  const headers = [
    {
      key: "Content-Security-Policy",
      value: buildCsp()
    },
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
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    }
  ];

  if (process.env.VERCEL_ENV === "production") {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload"
    });
  }

  return headers;
}

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
        headers: globalSecurityHeaders()
      }
    ];
  }
};

export default nextConfig;
