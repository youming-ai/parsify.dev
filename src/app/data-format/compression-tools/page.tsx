import { JsonLd } from '@/components/seo/json-ld';
import CompressionTool from '@/components/tools/utilities/compression-tool';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'compression-tools',
});

export default function UcompressionUtoolsPage() {
  const structuredData = generateToolStructuredData('compression-tools');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <CompressionTool />
      </div>
    </>
  );
}
