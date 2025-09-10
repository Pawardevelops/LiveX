import type { NextConfig } from "next";
const isProd = process.env.VERCEL_ENV === "production";

const nextConfig: NextConfig = {
  /* config options here */
  productionBrowserSourceMaps: !isProd,
};

export default nextConfig;
