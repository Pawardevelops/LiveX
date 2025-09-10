const isProd = process.env.VERCEL_ENV === "production";

module.exports = {
  productionBrowserSourceMaps: !isProd,
  webpack(config, { dev, isServer }) {
    if (process.env.VERCEL_ENV === "preview") {
      config.devtool = "source-map"; // ensures sourcesContent is embedded
    }
    return config;
  },
};
