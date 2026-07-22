import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Root this project's lockfile so Turbopack doesn't get confused
  // by monorepo/workspace lockfiles in parent directories.
  devIndicators: false,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
