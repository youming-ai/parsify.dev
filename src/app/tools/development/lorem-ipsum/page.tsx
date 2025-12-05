import { LoremIpsumGenerator } from '@/components/tools/generators/lorem-ipsum-generator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lorem Ipsum Generator | Parsify',
  description: 'Generate placeholder text by paragraphs, sentences, or words.',
};

export default function LoremIpsumPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <LoremIpsumGenerator />
    </div>
  );
}
