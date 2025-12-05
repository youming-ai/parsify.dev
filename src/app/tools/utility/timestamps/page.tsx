import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import type { Metadata } from 'next';
import TimestampConverterClient from './client';

export const metadata: Metadata = {
  title: 'Unix Timestamp Converter - Convert Epoch Time Online',
  description:
    'Free online Unix timestamp converter. Convert Unix timestamps to human-readable dates and vice versa. Support for milliseconds and multiple timezones.',
  keywords: [
    'unix timestamp',
    'epoch time',
    'timestamp converter',
    'date to timestamp',
    'timestamp to date',
    'timezone converter',
    'milliseconds',
  ],
  openGraph: {
    title: 'Unix Timestamp Converter - Parsify.dev',
    description: 'Convert Unix timestamps to dates and vice versa with timezone support.',
  },
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
    </div>
  );
}
