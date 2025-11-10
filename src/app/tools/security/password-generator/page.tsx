/**
 * Password Generator Page
 * Generate strong, secure passwords with customizable options
 */

import { PasswordGenerator } from '@/components/tools/security';
import { ToolWrapper } from '@/components/tools/tool-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Password Generator - Create Strong Secure Passwords | Parsify.dev',
	description:
		'Generate strong, secure passwords with customizable options. Create complex passwords with uppercase, lowercase, numbers, and special characters. Privacy-focused, client-side generation.',
	keywords: [
		'password generator',
		'secure password',
		'strong password',
		'password creator',
		'random password',
		'security tools',
		'privacy tools',
		'client-side generation',
		'password strength',
		'customizable passwords',
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
		canonical: '/tools/security/password-generator',
	},
	openGraph: {
		title: 'Password Generator - Create Strong Secure Passwords',
		description:
			'Generate strong, secure passwords with customizable options. Privacy-focused, client-side generation ensures maximum security.',
		url: '/tools/security/password-generator',
		siteName: 'Parsify.dev',
		locale: 'en_US',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Password Generator - Create Strong Secure Passwords',
		description:
			'Generate strong, secure passwords with customizable options. Privacy-focused, client-side generation ensures maximum security.',
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

export default function PasswordGeneratorPage() {
	return (
		<ToolWrapper
			title="Password Generator"
			description="Generate strong, secure passwords with customizable options. Privacy-focused generation ensures your passwords are never transmitted or stored."
			category="Security"
			features={[
				'Customizable length',
				'Multiple character sets',
				'Password strength indicator',
				'Instant generation',
				'Copy to clipboard',
				'Client-side only processing',
			]}
		>
			<PasswordGenerator />
		</ToolWrapper>
	);
}
