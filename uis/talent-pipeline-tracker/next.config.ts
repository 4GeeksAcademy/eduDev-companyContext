import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_TRACKER_BASE_PATH || "",
  // Preserve repository-owned instructions during builds and development.
  agentRules: false,
  allowedDevOrigins: [
    "100.75.110.66",
    "edu-homelab-02",
    "edu-homelab-02.taila1afd2.ts.net",
  ],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
