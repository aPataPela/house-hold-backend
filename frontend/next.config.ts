import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const apiProxyTarget = (
  process.env.API_PROXY_TARGET ?? "http://127.0.0.1:4000"
).replace(/\/$/, "");

const localNetworkOrigins = Object.values(networkInterfaces()).flatMap(
  (connections) =>
    connections
      ?.filter(
        (connection) => connection.family === "IPv4" && !connection.internal,
      )
      .map((connection) => connection.address) ?? [],
);

const configuredDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    ...new Set([...localNetworkOrigins, ...configuredDevOrigins]),
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
