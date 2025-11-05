import type { NextConfig } from "next";
import * as path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../../"),
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
