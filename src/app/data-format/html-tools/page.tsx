import { JsonLd } from '@/components/seo/json-ld';
import HTMLTools from '@/components/tools/code/html-tools';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'html-tools',
});

export default function UhtmlUtoolsPage() {
  const structuredData = generateToolStructuredData('html-tools');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <HTMLTools />
      </div>
    </>
  );
}
