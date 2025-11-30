import { ToolInfoSection } from '@/components/tools/tool-info-section';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Hash, Shield } from 'lucide-react';
import type { Metadata } from 'next';
import TimestampConverterClient from './client';

export const metadata: Metadata = {
  title: 'Unix Timestamp Converter - Convert Timestamps Instantly',
  description:
    'Convert Unix timestamps to human-readable dates and vice versa. Support for milliseconds and multiple timezones.',
  keywords: [
    'Unix timestamp',
    'epoch time',
    'date converter',
    'time converter',
    'timezone',
    'milliseconds',
  ],
};

export default function UnixConverterPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy Notice:</strong> Timestamp conversion is performed entirely in your
          browser. Your data never leaves your device.
        </AlertDescription>
      </Alert>

      <TimestampConverterClient />

      <ToolInfoSection
        features={[
          'Unix timestamps (seconds since epoch) support',
          'Millisecond timestamp conversion',
          'Multiple timezone support with auto-detection',
          'Real-time current timestamp display',
          'ISO 8601 and human-readable date formats',
          'Relative time calculations (e.g., "2 hours ago")',
        ]}
        info={{
          category: 'Time Tools',
          processing: 'Client Side',
          security: 'Local Only',
          difficulty: 'Beginner',
        }}
        related={[
          {
            name: 'Cron Expression Parser',
            description: 'Parse and understand cron expressions with human-readable descriptions',
            href: '/tools/utilities/cron-parser',
            icon: <Clock className="h-5 w-5" />,
          },
          {
            name: 'Number Base Converter',
            description: 'Convert numbers between binary, octal, decimal, and hexadecimal',
            href: '/tools/converters/number-base',
            icon: <Hash className="h-5 w-5" />,
          },
          {
            name: 'Hash Generator',
            description: 'Generate cryptographic hashes (MD5, SHA-1, SHA-256)',
            href: '/tools/data/hash-generator',
            icon: <Shield className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
}
