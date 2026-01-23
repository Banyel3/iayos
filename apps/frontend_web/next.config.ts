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
