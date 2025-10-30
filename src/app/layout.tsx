import type { Metadata } from 'next';
import { ErrorBoundary } from '@/components/error-boundary';
import { AnalyticsInitializer } from '@/components/analytics-initializer';
import { PerformanceMonitor } from '@/components/performance-monitor';

import './globals.css';

export const metadata: Metadata = {
	title: 'Parsify.dev - Professional Developer Tools',
	description:
		'Professional online developer tools for JSON processing, code execution, file transformation, and more. Run securely in your browser with no data sent to servers.',
	keywords: [
		'developer tools',
		'json formatter',
		'json validator',
		'code executor',
		'code formatter',
		'file processor',
		'online utilities',
		'browser tools',
		'wasm sandbox',
		'next.js tools',
		'typescript formatter',
		'css minifier',
		'base64 encoder',
		'url encoder',
	],
	authors: [{ name: 'Parsify.dev Team' }],
	creator: 'Parsify.dev',
	publisher: 'Parsify.dev',
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	openGraph: {
		title: 'Parsify.dev - Professional Developer Tools',
		description:
			'Professional online developer tools for JSON processing, code execution, file transformation, and more. Run securely in your browser with no data sent to servers.',
		type: 'website',
		url: 'https://parsify.dev',
		siteName: 'Parsify.dev',
		images: [
			{
				url: 'https://parsify.dev/og-image.png',
				width: 1200,
				height: 630,
				alt: 'Parsify.dev - Professional Developer Tools',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Parsify.dev - Professional Developer Tools',
		description:
			'Professional online developer tools for JSON processing, code execution, file transformation, and more.',
		images: ['https://parsify.dev/og-image.png'],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': '-1',
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="min-h-screen bg-background font-sans antialiased">
				<ErrorBoundary
					onError={(error, errorInfo) => {
						// Log errors to analytics in production
						if (process.env.NODE_ENV === 'production') {
							console.error('Production error:', error, errorInfo);
						}
					}}
					maxRetries={3}
				>
					<PerformanceMonitor>
						<AnalyticsInitializer>{children}</AnalyticsInitializer>
					</PerformanceMonitor>
				</ErrorBoundary>
			</body>
		</html>
	);
}
