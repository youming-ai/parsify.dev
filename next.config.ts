import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env['ANALYZE'] === 'true',
});

const nextConfig: NextConfig = {
  // OpenNext requires standalone output mode for Cloudflare Workers
  output: 'standalone',
  reactStrictMode: true,
  // Note: @phosphor-icons/react removed from transpilePackages
  // It already publishes ES modules compatible with Next.js 15
  // Transpiling causes issues with Turbopack + RSC
  poweredByHeader: false,
  compress: true,

  // Image optimization - using Cloudflare Images
  images: {
    // Disable Next.js image optimization, use Cloudflare Images instead
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Experimental performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@phosphor-icons/react'],
  },

  // Turbopack enabled via `next dev --turbo`

  // Bundle analyzer and code splitting (webpack fallback when not using Turbopack)
  webpack: (config, { dev, isServer }) => {
    // Fix for entities package import compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      'entities/lib/decode.js': 'entities/lib/decode.js',
      'entities/lib/decode_codepoint.js': 'entities/lib/decode_codepoint.js',
      'entities/lib/encode_codepoint.js': 'entities/lib/encode_codepoint.js',
      'entities/lib/encode.js': 'entities/lib/encode.js',
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    // Only run bundle analyzer in production and not on server
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
      };
    }

    return config;
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
    ];
  },
};

// Initialize OpenNext for development mode
// if (process.env.NODE_ENV === 'development') {
//   initOpenNextCloudflareForDev();
// }

export default withBundleAnalyzer(nextConfig);
