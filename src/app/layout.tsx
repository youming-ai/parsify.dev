import { AnalyticsInitializer } from '@/components/analytics-initializer';
import { ErrorBoundary } from '@/components/error-boundary';
import { PerformanceMonitor } from '@/components/performance-monitor';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Inter } from 'next/font/google';

import './globals.css';

// Inter font for DevKit design
const inter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
	display: 'swap',
});

// Add Material Symbols to global head
export function MaterialSymbolsFonts() {
	return (
		<>
			<link
				rel="stylesheet"
				href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
			/>
		</>
	);
}

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
			<head>
				<MaterialSymbolsFonts />
			</head>
			<body className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					<ErrorBoundary maxRetries={3}>
						<PerformanceMonitor>
							<AnalyticsInitializer>{children}</AnalyticsInitializer>
						</PerformanceMonitor>
					</ErrorBoundary>
				</ThemeProvider>
			</body>
		</html>
	);
}
