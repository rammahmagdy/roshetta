import type { NextConfig } from 'next';

// In production the client + server run side-by-side in the same container,
// and the client rewrites /api/* to localhost:4000 (the Express server).
// In a split deploy, set API_BASE_URL to the public server URL.
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone keeps the Docker image small and avoids a known Next 15.5
  // bug where prerendering a synthetic /404 leaks an <Html> import.
  output: 'standalone',
  // Skip ESLint during the production build so a lint warning never blocks
  // a deploy. Run `npm run lint` locally if needed.
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
