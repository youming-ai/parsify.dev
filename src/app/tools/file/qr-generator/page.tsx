/**
 * QR Generator Page
 * Generate QR codes for URLs, text, WiFi, and other data types
 */

import { QRGenerator } from '@/components/tools/file/qr-generator';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'QR Code Generator - Create QR Codes for Free | Parsify.dev',
	description:
		'Generate QR codes for URLs, text, WiFi networks, emails, and contact information. Multiple formats and customization options available.',
	keywords: ['qr code generator', 'qr creator', 'wifi qr code', 'url qr code', 'vcard qr generator', 'qr maker'],
};

export default function QRGeneratorPage() {
	return (
		<ToolPageWrapper
			title="QR Code Generator"
			description="Generate QR codes for URLs, text, WiFi, and other data types"
			toolId="qr-generator"
		>
			<QRGenerator />
		</ToolPageWrapper>
	);
}
