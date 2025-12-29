import { JsonLd } from '@/components/seo/json-ld';
import { URLEncoder } from '@/components/tools/utilities/url-encoder';
import { URLEncoderDocs } from '@/components/tools/utilities/url-encoder-docs';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'url-parser',
});

export default function URLEncoderPage() {
  const structuredData = generateToolStructuredData('url-parser');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="space-y-6">
          <URLEncoder />
          <URLEncoderDocs />
        </div>
      </div>
    </>
  );
}
