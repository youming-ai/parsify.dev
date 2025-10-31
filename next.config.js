/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		unoptimized: true,
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'parsify.dev',
				pathname: '/**',
			},
		],
	},

	// Enable React Compiler (Next.js 16)
	reactCompiler: true,

	// Experimental features
	experimental: {
		optimizeCss: true,
		optimizePackageImports: ['lucide-react', 'clsx', 'tailwind-merge'],
	},

	// Environment variables
	env: {
		NEXT_PUBLIC_API_BASE_URL:
			process.env.NEXT_PUBLIC_API_BASE_URL ||
			(process.env.NODE_ENV === 'production' ? 'https://api.parsify.dev' : 'http://localhost:3000'),
	},

	// Security configuration
	poweredByHeader: false,

	// Performance optimization
	compress: true,
};

module.exports = nextConfig;
