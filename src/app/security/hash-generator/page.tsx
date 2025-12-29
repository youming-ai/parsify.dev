import { JsonLd } from '@/components/seo/json-ld';
import { HashGeneratorDocs } from '@/components/tools/data/hash-generator-docs';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'hash-generator',
});

export default function HashGeneratorPage() {
  const structuredData = generateToolStructuredData('hash-generator');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <HashGeneratorDocs />
      </div>
    </>
  );
}
