import createNextIntlPlugin from 'next-intl/plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactCompiler: true,

	experimental: {
		optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
		// Enable image optimization for better performance
		optimizedServerImports: true,
		scrollRestoration: true,
	},
	turbopack: {},
	// Enhanced image optimization configuration
	images: {
		formats: ['image/webp', 'image/avif'],
		domains: [],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		minimumCacheTTL: 86400, // 24 hours cache
		// Enable advanced image optimization
		allowFutureImageFormats: true,
		dangerouslyAllowSVG: true,
		contentDispositionType: 'attachment',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},
	// Compression configuration
	compress: true,
	poweredByHeader: false,
	generateEtags: true,
	webpack: (config, { isServer, dev }) => {
		// Enable Web Workers for client-side processing
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				path: false,
				crypto: false,
			};

			// Configure worker loader
			config.module.rules.push({
				test: /\.worker\.(js|ts)$/,
				use: {
					loader: 'worker-loader',
					options: {
						name: 'static/[hash].[name].js',
						publicPath: '/_next/',
					},
				},
			});
		}

		// Asset optimization rules
		if (!dev) {
			// Optimize images and other assets in production
			config.module.rules.push({
				test: /\.(png|jpe?g|gif|webp|avif|svg)$/i,
				type: 'asset/resource',
				generator: {
					filename: 'static/images/[hash].[name][ext]',
				},
				use: [
					{
						loader: 'sharp-loader',
						options: {
							format: ['webp', 'avif'],
							quality: 80,
							progressive: true,
						},
					},
				],
			});

			// Minify SVG assets
			config.module.rules.push({
				test: /\.svg$/i,
				oneOf: [
					{
						resourceQuery: /component/,
						use: ['@svgr/webpack'],
					},
					{
						type: 'asset/resource',
						use: [
							{
								loader: 'svgo-loader',
								options: {
									plugins: [
										{
											name: 'preset-default',
											params: {
												overrides: {
													removeViewBox: false,
													cleanupIds: true,
													convertColors: true,
													convertPathData: true,
													cleanupNumericValues: true,
													collapseGroups: true,
												},
											},
										},
									],
								},
							},
						],
					},
				],
			});

			// Optimize font loading
			config.module.rules.push({
				test: /\.(woff|woff2|eot|ttf|otf)$/i,
				type: 'asset/resource',
				generator: {
					filename: 'static/fonts/[hash].[name][ext]',
				},
			});
		}

		// Bundle analysis and optimization
		if (process.env.ANALYZE === 'true') {
			const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
			config.plugins.push(
				new BundleAnalyzerPlugin({
					analyzerMode: 'static',
					openAnalyzer: false,
					reportFilename: '../bundle-analysis.html',
				})
			);
		}

		// Asset optimization plugins
		if (!dev) {
			const CompressionPlugin = require('compression-webpack-plugin');
			config.plugins.push(
				new CompressionPlugin({
					algorithm: 'gzip',
					test: /\.(js|css|html|svg|json|ico|png|jpg|jpeg|webp|avif)$/,
					threshold: 8192,
					minRatio: 0.8,
				}),
				new CompressionPlugin({
					filename: '[path][base].br',
					algorithm: 'brotliCompress',
					test: /\.(js|css|html|svg|json|ico|png|jpg|jpeg|webp|avif)$/,
					threshold: 8192,
					minRatio: 0.8,
				})
			);
		}

		return config;
	},
	// Enhanced headers for performance and security
	headers: async () => [
		{
			source: '/(.*)',
			headers: [
				{
					key: 'Cross-Origin-Embedder-Policy',
					value: 'require-corp',
				},
				{
					key: 'Cross-Origin-Opener-Policy',
					value: 'same-origin',
				},
				// Performance headers
				{
					key: 'X-DNS-Prefetch-Control',
					value: 'on',
				},
				{
					key: 'X-Content-Type-Options',
					value: 'nosniff',
				},
			],
		},
		{
			source: '/_next/image(.*)',
			headers: [
				{
					key: 'Cache-Control',
					value: 'public, max-age=31536000, immutable',
				},
			],
		},
		{
			source: '/static/(.*)',
			headers: [
				{
					key: 'Cache-Control',
					value: 'public, max-age=31536000, immutable',
				},
			],
		},
	],
	// Configure static file serving
	async rewrites() {
		return [];
	},
	// Enable optimized builds
	swcMinify: true,
	// Configure experimental features for better performance
	experimental: {
		optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
		optimizedServerImports: true,
		scrollRestoration: true,
		// Enable image optimization features
		appDir: true,
		serverComponentsExternalPackages: ['sharp'],
	},
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
