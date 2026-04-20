import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  generateBuildId: async () => {
    return process.env.BUILD_ID || "development";
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "@tanstack/react-table",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@radix-ui/react-avatar",
      "@radix-ui/react-slot",
      "react-hook-form",
      "zod",
    ],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
