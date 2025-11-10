import { Metadata } from 'next';
import { TextEncoder } from '@/components/tools/text/text-encoder';

export const metadata: Metadata = {
	title: 'Text Encoder - Encode and Decode Text | Parsify.dev',
	description:
		'Encode and decode text using various encoding formats including Base64, URL encoding, HTML entities, Unicode escape, hexadecimal, and binary. Fast, secure, and free online text encoder.',
	keywords:
		'text encoder, text decoder, base64 encoder, url encoder, html encoder, unicode encoder, hex encoder, binary encoder, text encoding, text decoding',
};

export default function TextEncoderPage() {
	return <TextEncoder />;
}
