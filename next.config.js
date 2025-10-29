/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Node.js runtime for OpenNext compatibility
  // Enable standalone build for Cloudflare Workers
  output: "standalone",

  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  distDir: ".next",

  // Enable React Compiler (Next.js 16)
  reactCompiler: true,

  // Experimental features
  experimental: {
    optimizeCss: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_MICROSOFT_CLARITY_ID:
      process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID || "",
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://api.parsify.dev"
        : "http://localhost:3000"),
  },

  // Security configuration
  poweredByHeader: false,

  // Performance optimization
  compress: true,

  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
};

// Initialize OpenNext for local development
if (process.env.NODE_ENV === "development") {
  try {
    const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
    initOpenNextCloudflareForDev();
  } catch (error) {
    console.warn(
      "OpenNext Cloudflare development initialization failed:",
      error.message,
    );
  }
}

module.exports = nextConfig;
