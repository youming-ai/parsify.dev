import { LoremIpsumGenerator } from '@/components/tools/generators/lorem-ipsum-generator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lorem Ipsum Generator - Generate Placeholder Text Online',
  description:
    'Free online Lorem Ipsum generator. Generate placeholder text by paragraphs, sentences, or words. Perfect for designers and developers creating mockups.',
  keywords: [
    'lorem ipsum generator',
    'placeholder text',
    'dummy text',
    'filler text',
    'mockup text',
    'design placeholder',
  ],
  openGraph: {
    title: 'Lorem Ipsum Generator - Parsify.dev',
    description: 'Generate placeholder text for your designs and mockups instantly.',
  },
};

export default function LoremIpsumPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <LoremIpsumGenerator />
    </div>
  );
}
