/**
 * Hash Generator Page
 * Generate secure cryptographic hashes from text or files
 */

import { HashGenerator } from '@/components/tools/security';
import { ToolWrapper } from '@/components/tools/tool-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Hash Generator - Create Secure Cryptographic Hashes | Parsify.dev',
	description:
		'Generate secure cryptographic hashes from text or files. Supports MD5, SHA-1, SHA-256, SHA-512, and more hashing algorithms. Privacy-focused, client-side processing.',
	keywords: [
		'hash generator',
		'cryptographic hash',
		'MD5 hash',
		'SHA-256',
		'SHA-512',
		'file hash',
		'checksum generator',
		'security tools',
		'privacy-focused',
		'client-side hashing',
	],
	authors: [{ name: 'Parsify.dev' }],
	creator: 'Parsify.dev',
	publisher: 'Parsify.dev',
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	metadataBase: new URL('https://parsify.dev'),
	alternates: {
		canonical: '/tools/security/hash-generator',
	},
	openGraph: {
		title: 'Hash Generator - Create Secure Cryptographic Hashes',
		description:
			'Generate secure cryptographic hashes from text or files with multiple algorithms. Privacy-focused, client-side processing.',
		url: '/tools/security/hash-generator',
		siteName: 'Parsify.dev',
		locale: 'en_US',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Hash Generator - Create Secure Cryptographic Hashes',
		description:
			'Generate secure cryptographic hashes from text or files with multiple algorithms. Privacy-focused, client-side processing.',
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
};

export default function HashGeneratorPage() {
	return (
		<ToolWrapper
			title="Hash Generator"
			description="Generate secure cryptographic hashes from text or files. Privacy-focused, client-side processing ensures your data never leaves your browser."
			category="Security"
			features={[
				'Multiple hash algorithms',
				'File and text input',
				'Instant processing',
				'Privacy-focused',
				'No server upload',
			]}
		>
			<HashGenerator />
		</ToolWrapper>
	);
}
