const isProd = process.env.VERCEL_ENV === "production";

module.exports = {
  productionBrowserSourceMaps: !isProd,
  webpack(config, { dev, isServer }) {
    if (process.env.VERCEL_ENV === "preview") {
      // Force full source maps with TypeScript inlined
      config.devtool = "eval-source-map"; // or "inline-source-map"
    }
    return config;
  },
};
