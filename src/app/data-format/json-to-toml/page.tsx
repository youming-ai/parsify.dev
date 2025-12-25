import { JsonLd } from '@/components/seo/json-ld';
import JsonToTomlClient from '@/components/tools/json/json-to-toml';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'json-to-toml',
});

export default function JsonToTomlPage() {
  const structuredData = generateToolStructuredData('json-to-toml');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <JsonToTomlClient />
      </div>
    </>
  );
}
