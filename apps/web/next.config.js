/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  basePath: '',
  distDir: 'out',

  // Disable TypeScript checks during build to speed up deployment
  typescript: {
    ignoreBuildErrors: false,
  },

  // Disable ESLint during build to speed up deployment
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_MICROSOFT_CLARITY_ID: process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID || '',
  },

  // Custom webpack configuration for Cloudflare
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
