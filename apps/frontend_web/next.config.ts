import type { NextConfig } from "next";
import * as path from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Permanent redirects for removed worker/client web routes (SEO cleanup)
  async redirects() {
    return [
      {
        source: "/dashboard/:path*",
        destination: "/mobile-only",
        permanent: true,
      },
    ];
  },
  // In local dev: proxy /api/* and /ws/* through Next.js to avoid CORS.
  // Defaults to the live backend so `npm run dev` works without a local server.
  // Override with BACKEND_PROXY_URL=http://localhost:8000 to use a local backend.
  // Leave NEXT_PUBLIC_API_URL unset so client uses relative /api/* paths.
  async rewrites() {
    const proxyTarget = process.env.BACKEND_PROXY_URL || "https://api.iayos.online";
    const proxyRewrites = proxyTarget
      ? [
        { source: "/api/:path*", destination: `${proxyTarget}/api/:path*` },
        { source: "/ws/:path*", destination: `${proxyTarget}/ws/:path*` },
      ]
      : [];
    return { beforeFiles: proxyRewrites };
  },
  // Enable experimental features for better caching

  experimental: {
    staleTimes: {
      dynamic: 30, // 30 seconds for dynamic pages
      static: 180, // 3 minutes for static pages
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "agtldjbubhrrsxnsdaxc.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude TypeScript definition files from processing
    config.module.rules.push({
      test: /\.d\.ts$/,
      type: "asset/resource",
      generator: {
        emit: false,
      },
    });

    // Ignore TypeScript definition files in node_modules
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    return config;
  },
  transpilePackages: ["rate-limiter-flexible"],
};

export default nextConfig;
