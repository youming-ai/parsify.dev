import { JsonLd } from '@/components/seo/json-ld';
import LoremIpsumGenerator from '@/components/tools/generators/lorem-ipsum-generator';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'lorem-ipsum',
});

export default function UloremUipsumPage() {
  const structuredData = generateToolStructuredData('lorem-ipsum');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <LoremIpsumGenerator />
      </div>
    </>
  );
}
