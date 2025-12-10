import { PixelToolHeader } from '@/components/tools/shared/pixel-tool-header';
import { FileText } from 'lucide-react';
import type { Metadata } from 'next';
import TextCounterClient from './client';

export const metadata: Metadata = {
  title: 'Text Inspector - Word Counter & Character Counter Online',
  description:
    'Free online text analyzer. Count characters, words, lines, sentences with reading time calculation. Get encoding info and byte size analysis.',
  keywords: [
    'word counter',
    'character counter',
    'text analyzer',
    'line counter',
    'reading time calculator',
    'text statistics',
    'letter counter',
  ],
  openGraph: {
    title: 'Text Inspector - Parsify.dev',
    description: 'Analyze text with word count, character count, and reading time.',
  },
};

export default function TextCounterPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <PixelToolHeader
        title="TEXT INSPECTOR"
        description="Count characters, words, lines, sentences using detailed analysis. Includes reading time calculation."
        category="Development"
        icon={<FileText className="h-8 w-8" />}
      />

      <div className="mb-8 border-l-4 border-yellow-500 bg-yellow-100 p-4 font-mono text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
        <strong className="uppercase">[ Privacy Notice ]</strong>
        <br />
        Text analysis is performed entirely in your browser. Your text never leaves your device.
      </div>

      <TextCounterClient />
    </div>
  );
}
