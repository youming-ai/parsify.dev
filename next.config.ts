import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Image optimization - using Cloudflare Images
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'parsify.dev' },
      { protocol: 'https', hostname: '*.parsify.dev' },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@phosphor-icons/react'],
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/api/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' }],
      },
    ];
  },
};

export default nextConfig;
