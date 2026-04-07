import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateBuildId: async () => {
    return process.env.BUILD_ID || "development";
  },
};

export default nextConfig;
