import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
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
      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy Notice:</strong> Text analysis is performed entirely in your browser. Your
          text never leaves your device.
        </AlertDescription>
      </Alert>

      <TextCounterClient />
    </div>
  );
}
