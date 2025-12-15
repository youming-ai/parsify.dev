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
    <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
      <div className="mb-8 border-l-4 border-yellow-500 bg-yellow-100 p-4 font-mono text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
        <strong className="uppercase">[ Privacy Notice ]</strong>
        <br />
        Timestamp conversion is performed entirely in your browser. Your data never leaves your
        device.
      </div>

      <TimestampConverterClient />
    </div>
  );
}
