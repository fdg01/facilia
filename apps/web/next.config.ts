import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  basePath: "/facilia",
  turbopack: {
    root: resolve(import.meta.dirname, "../.."),
    resolveAlias: {
      "@modules": resolve(import.meta.dirname, "../../modules"),
    },
  },
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
