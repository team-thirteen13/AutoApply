import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Cloudflare compatibility ──────────────────────────────
  // Disable server-side caching headers that conflict with
  // Cloudflare's edge cache. Individual pages opt in via
  // `export const dynamic = "force-dynamic"` when needed.
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
      ],
    },
  ],
  // ── Server external packages ──────────────────────────────
  // pdfjs-dist requires its worker file at runtime. Turbopack's
  // bundling breaks the worker resolution. Externalize these
  // packages so they load from node_modules at runtime.
  serverExternalPackages: ["pdfjs-dist", "pdf-parse"],
  devIndicators: false,
};
