import { JsonLd } from '@/components/seo/json-ld';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import TimestampConverterClient from './client';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'timestamps',
  customTitle: 'Unix Timestamp Converter - Convert Epoch Time Online',
  customDescription:
    'Free online Unix timestamp converter. Convert Unix timestamps to human-readable dates and vice versa. Support for milliseconds and multiple timezones.',
  extraKeywords: [
    'epoch time',
    'date to timestamp',
    'timestamp to date',
    'timezone converter',
    'milliseconds',
  ],
});

export default function UnixConverterPage() {
  const structuredData = generateToolStructuredData('timestamps');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="mb-8 border-l-4 border-yellow-500 bg-yellow-100 p-4 font-mono text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
          <strong className="uppercase">[ Privacy Notice ]</strong>
          <br />
          Timestamp conversion is performed entirely in your browser. Your data never leaves your
          device.
        </div>

        <TimestampConverterClient />
      </div>
    </>
  );
}
