import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,
};

// Use dynamic import to avoid ESLint no-require-imports error
const withPWA = require("next-pwa");

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  reactStrictMode: true,
});

module.exports = pwaConfig(nextConfig);
