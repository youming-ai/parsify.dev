/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export to enable API routes
  // output: 'export',

  // Production configuration for Cloudflare Pages with Functions
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  basePath: '',
  distDir: '.next',

  // Enable React Compiler (Next.js 16)
  reactCompiler: true,

  // Server external packages
  serverExternalPackages: ['monaco-editor'],

  // Experimental features
  experimental: {
    optimizeCss: true,
  },

  // Disable TypeScript checks during build to speed up deployment
  typescript: {
    ignoreBuildErrors: false,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_MICROSOFT_CLARITY_ID: process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID || '',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ||
      (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'),
  },

  // API rewrites for backward compatibility
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      },
    ];
  },

  // Turbopack configuration (Next.js 16)
  turbopack: {
    // Custom Turbopack config if needed
  },

  // Security configuration
  poweredByHeader: false,

  // Performance optimization
  compress: true,

  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

module.exports = nextConfig;
