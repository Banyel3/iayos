import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
};

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  reactStrictMode: true,
});

export default nextConfig;
