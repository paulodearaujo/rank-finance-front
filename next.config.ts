import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  experimental: {
    // Enable optimizePackageImports only in production to avoid dev/Turbopack runtime issues
    ...(isDev ? {} : { optimizePackageImports: ["@tabler/icons-react", "framer-motion"] }),
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
