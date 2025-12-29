import { JsonLd } from '@/components/seo/json-ld';
import { IdGenerator } from '@/components/tools/generators/id-generator';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'id-generator',
});

export default function IDGeneratorPage() {
  const structuredData = generateToolStructuredData('id-generator');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <IdGenerator />
      </div>
    </>
  );
}
