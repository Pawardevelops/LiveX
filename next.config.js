/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/worklets/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optional: Also ignore ESLint errors if needed
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Additional config for experimental features if needed
  experimental: {
    typedRoutes: false, // Disable if causing issues
  },
};

module.exports = nextConfig;
