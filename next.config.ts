import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Claude Agent SDK spawns a subprocess — must run as native Node, not bundled
  serverExternalPackages: ["@anthropic-ai/claude-agent-sdk"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
