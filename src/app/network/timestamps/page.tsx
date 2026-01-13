import { JsonLd } from '@/components/seo/json-ld';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
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
        <PrivacyNotice message="Timestamp conversion is performed entirely in your browser. Your data never leaves your device." />
        <TimestampConverterClient />
      </div>
    </>
  );
}
