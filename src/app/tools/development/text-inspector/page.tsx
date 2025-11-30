import { ToolInfoSection } from '@/components/tools/tool-info-section';
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

      <ToolInfoSection
        features={[
          'Character count (with/without spaces)',
          'Word count with intelligent detection',
          'Line count and paragraph analysis',
          'Reading time estimation',
          'Most frequent words analysis',
          'Readability score calculation',
        ]}
        info={{
          category: 'Text Tools',
          processing: 'Client Side',
          security: 'Local Only',
          difficulty: 'Beginner',
        }}
        related={[
          {
            name: 'Case Converter',
            description: 'Convert text between different cases',
            href: '/tools/text/case-converter',
            icon: <CaseSensitive className="h-5 w-5" />,
          },
          {
            name: 'Text Analyzer',
            description: 'Analyze text for readability and sentiment',
            href: '/tools/text/analyzer',
            icon: <FileText className="h-5 w-5" />,
          },
          {
            name: 'Text Encoding Converter',
            description: 'Convert text between different encodings',
            href: '/tools/text/encoding-converter',
            icon: <AlignLeft className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
}
