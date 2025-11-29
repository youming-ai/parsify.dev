import { EncodingConverter } from '@/components/tools/utils/encoding-converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advanced Encoding Converter | Parsify',
  description:
    'Comprehensive encoding converter supporting Unicode, Base64 family, hash functions, binary, URL, HTML, and custom encoding formats.',
  keywords: [
    'encoding converter',
    'unicode converter',
    'base64 converter',
    'hash generator',
    'url encoder',
    'text encoding',
    'binary converter',
    'character encoding',
  ],
  openGraph: {
    title: 'Advanced Encoding Converter',
    description: 'Convert between Unicode, Base64, hash functions, and other encoding formats',
    type: 'website',
  },
};

export default function EncodingConverterPage() {
  return (
    <div className="container mx-auto py-8">
      <EncodingConverter />
    </div>
  );
}
