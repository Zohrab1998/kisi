import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Lets the ngrok tunnel (or any other dev-time proxy host) load the dev
  // server's HMR/client assets — otherwise client-side JS silently breaks
  // for anyone not on localhost. Dev-only; irrelevant in production.
  allowedDevOrigins: ["self-water-frozen.ngrok-free.dev"],
};

export default nextConfig;
