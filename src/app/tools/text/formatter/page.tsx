import { Metadata } from 'next';
import { TextFormatter } from '@/components/tools/text/text-formatter';

export const metadata: Metadata = {
	title: 'Text Formatter - Format and Clean Text | Parsify.dev',
	description:
		'Format and clean text with advanced options including case conversion, whitespace handling, line processing, and special character removal. Professional text formatting tool.',
	keywords:
		'text formatter, text cleaner, case converter, whitespace formatter, line formatter, text formatting, text cleaning, text case conversion',
};

export default function TextFormatterPage() {
	return <TextFormatter />;
}
