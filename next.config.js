/** @type {import('next').NextConfig} */
const nextConfig = {
	// Use Node.js runtime for OpenNext compatibility
	// Enable standalone build for Cloudflare Workers
	output: 'standalone',

	trailingSlash: true,
	images: {
		unoptimized: true,
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'parsify.dev',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'www.parsify.dev',
				port: '',
				pathname: '/**',
			},
		],
	},
	distDir: '.next',

	// Enable React Compiler (Next.js 16)
	reactCompiler: true,

	// Experimental features
	experimental: {
		optimizeCss: true,
		// Optimize package imports
		optimizePackageImports: ['lucide-react', 'clsx', 'tailwind-merge'],
	},

	// Turbopack configuration
	turbopack: {
		// Set root directory to fix workspace root warning
		root: __dirname,
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

	// Bundle analyzer configuration
	webpack: (config, { isServer, dev, webpack }) => {
		// Enable bundle analyzer in analyze mode
		if (process.env.ANALYZE === 'true') {
			const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
			config.plugins.push(
				new BundleAnalyzerPlugin({
					analyzerMode: 'static',
					openAnalyzer: false,
					reportFilename: isServer ? 'bundle-analyzer-server.html' : 'bundle-analyzer-client.html',
				}),
			);
		}

		// Optimize Monaco Editor
		if (!isServer) {
			config.resolve.alias = {
				...config.resolve.alias,
				'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api',
			};

			// Reduce bundle size by excluding unnecessary Monaco locales
			config.plugins.push(
				new webpack.IgnorePlugin({
					resourceRegExp: /^\.\/locale\/.*$/,
					contextRegExp: /moment$/,
				}),
			);
		}

		// Performance budgets
		config.performance = {
			hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
			maxEntrypointSize: 512000, // 512KB
			maxAssetSize: 256000, // 256KB
		};

		return config;
	},

	// Logging
	logging: {
		fetches: {
			fullUrl: process.env.NODE_ENV === 'development',
		},
	},
};

// Initialize OpenNext for local development
if (process.env.NODE_ENV === 'development') {
	try {
		const { initOpenNextCloudflareForDev } = require('@opennextjs/cloudflare');
		initOpenNextCloudflareForDev();
	} catch (error) {
		console.warn('OpenNext Cloudflare development initialization failed:', error.message);
	}
}

module.exports = nextConfig;
