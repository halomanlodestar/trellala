import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for EC2 deploys; trace from the monorepo root so workspace packages are included.
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  transpilePackages: ["@trellala/core", "@trellala/db", "@trellala/queue"],
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "bullmq", "ioredis"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
