import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  // General hardening and size/perf optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  output: "standalone",

  // Compiler-time optimizations (prod-only where applicable)
  compiler: {
    ...(isDev ? {} : { removeConsole: { exclude: ["error", "warn"] } }),
    ...(isDev ? {} : { reactRemoveProperties: true }),
  },

  experimental: {
    // Enable optimizePackageImports only in production to avoid dev/Turbopack runtime issues
    ...(isDev
      ? {}
      : { optimizePackageImports: ["@tabler/icons-react", "framer-motion", "lucide-react"] }),
  },

  async headers() {
    if (!isDev) return [];
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
