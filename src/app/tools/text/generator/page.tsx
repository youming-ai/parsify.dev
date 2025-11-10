import { Metadata } from 'next';
import { TextGenerator } from '@/components/tools/text/text-generator';

export const metadata: Metadata = {
	title: 'Text Generator - Generate Lorem Ipsum, Passwords, UUIDs | Parsify.dev',
	description:
		'Generate various types of text including Lorem ipsum placeholder text, secure passwords, UUIDs, random text, hash values, and custom patterns. Advanced text generation tool.',
	keywords:
		'text generator, lorem ipsum generator, password generator, uuid generator, random text generator, hash generator, pattern generator, text creation',
};

export default function TextGeneratorPage() {
	return <TextGenerator />;
}
