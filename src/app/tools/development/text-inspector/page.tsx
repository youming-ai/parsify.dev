import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlignLeft, CaseSensitive, FileText, Shield } from 'lucide-react';
import type { Metadata } from 'next';
import TextCounterClient from './client';

export const metadata: Metadata = {
  title: 'Text Character Counter - Count Words, Characters & Lines',
  description:
    'Advanced text analyzer with character, word, line counting, reading time calculation and more.',
  keywords: [
    'text counter',
    'character count',
    'word count',
    'line count',
    'reading time',
    'text analysis',
  ],
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
