import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { Base64StringDocs } from '@/components/tools/utilities/base64-string-docs';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'base64-string',
  customTitle: 'Base64 String Encoder/Decoder - Encode & Decode Text Online',
  customDescription:
    'Free online Base64 encoder and decoder. Convert text to Base64 and decode Base64 to text instantly. Secure, client-side processing with no data sent to servers.',
  extraKeywords: ['text encoding', 'base64 converter', 'online tool', 'data encoding'],
});

const Base64Converter = dynamic(
  () =>
    import('@/components/tools/utilities/base64-converter').then((mod) => ({
      default: mod.Base64Converter,
    })),
  {
    loading: () => <ToolLoading message="Loading Base64 Converter..." />,
  }
);

export default function Base64ConverterPage() {
  const structuredData = generateToolStructuredData('base64-string');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="Base64 encoding/decoding is performed entirely in your browser. Your text never leaves your device." />
        <div className="space-y-8">
          <div className="bg-card rounded-xl border shadow-sm">
            <Base64Converter />
          </div>
          <Base64StringDocs />
        </div>
      </div>
    </>
  );
}
