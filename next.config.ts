import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Ensure server listens on all interfaces
  serverExternalPackages: ["@anthropic-ai/sdk"],

  // Disable telemetry in production
  experimental: {
    // Improve cold start times
  },
};

export default nextConfig;
