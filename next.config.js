/** @type {import('next').NextConfig} */
const nextConfig = {
	// Static export for Cloudflare Pages
	output: 'export',

	trailingSlash: true,
	images: {
		unoptimized: true,
	},
	distDir: 'out',

	// Enable React Compiler (Next.js 16)
	reactCompiler: true,

	// Experimental features
	experimental: {
		optimizeCss: true,
	},

	// Environment variables
	env: {
		NEXT_PUBLIC_MICROSOFT_CLARITY_ID: process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID || '',
		NEXT_PUBLIC_API_BASE_URL:
			process.env.NEXT_PUBLIC_API_BASE_URL ||
			(process.env.NODE_ENV === 'production' ? 'https://api.parsify.dev' : 'http://localhost:3000'),
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
