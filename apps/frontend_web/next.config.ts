import type { NextConfig } from "next";
import * as path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../../"),
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

// Use dynamic import to avoid ESLint no-require-imports error
const withPWA = require("next-pwa");

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

module.exports = pwaConfig(nextConfig);
