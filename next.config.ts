import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
  },

  // Experimental performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-slider',
      '@monaco-editor/react',
    ],
  },

  // Turbopack configuration (Next.js 16 default)
  turbopack: {},

  // Bundle analyzer and code splitting (webpack fallback when not using Turbopack)
  webpack: (config, { dev, isServer }) => {
    // Monaco Editor: ensure server-side polyfills are disabled
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
        cacheGroups: {
          // Vendor chunks for third-party libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          // Monaco Editor chunk (separate for better caching)
          monaco: {
            test: /[\\/]node_modules[\\/]monaco-editor[\\/]/,
            name: 'monaco',
            chunks: 'all',
            priority: 20,
          },
          // Common chunks for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
            priority: 10,
          },
          // UI components chunk
          ui: {
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 15,
          },
        },
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

export default nextConfig;
