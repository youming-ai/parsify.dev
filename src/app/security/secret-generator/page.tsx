import { JsonLd } from '@/components/seo/json-ld';
import SecretGenerator from '@/components/tools/security/secret-generator';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'secret-generator',
});

export default function UsecretUgeneratorPage() {
  const structuredData = generateToolStructuredData('secret-generator');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <SecretGenerator />
      </div>
    </>
  );
}
