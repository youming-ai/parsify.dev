/**
 * File Encryptor Page
 * Encrypt and decrypt files securely with client-side processing
 */

import { FileEncryptor } from '@/components/tools/security';
import { ToolWrapper } from '@/components/tools/tool-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'File Encryptor - Secure File Encryption & Decryption | Parsify.dev',
	description:
		'Encrypt and decrypt files securely with military-grade AES encryption. Privacy-focused, client-side processing ensures your files never leave your browser. Support for multiple file formats.',
	keywords: [
		'file encryptor',
		'file encryption',
		'file decryption',
		'AES encryption',
		'secure file storage',
		'privacy tools',
		'client-side encryption',
		'military-grade encryption',
		'security tools',
		'file security',
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
		canonical: '/tools/security/encryptor',
	},
	openGraph: {
		title: 'File Encryptor - Secure File Encryption & Decryption',
		description:
			'Encrypt and decrypt files securely with military-grade AES encryption. Privacy-focused, client-side processing.',
		url: '/tools/security/encryptor',
		siteName: 'Parsify.dev',
		locale: 'en_US',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'File Encryptor - Secure File Encryption & Decryption',
		description:
			'Encrypt and decrypt files securely with military-grade AES encryption. Privacy-focused, client-side processing.',
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

export default function FileEncryptorPage() {
	return (
		<ToolWrapper
			title="File Encryptor"
			description="Encrypt and decrypt files securely with military-grade AES encryption. Your files never leave your browser - complete privacy guaranteed."
			category="Security"
			features={[
				'Military-grade AES encryption',
				'Client-side processing only',
				'Support for multiple file types',
				'Secure password protection',
				'Instant encryption & decryption',
				'Zero data exposure',
			]}
		>
			<FileEncryptor />
		</ToolWrapper>
	);
}
