import { JsonLd } from '@/components/seo/json-ld';
import { SqlTools } from '@/components/tools/code/sql-tools';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'sql-tools',
});

export default function SQLToolsPage() {
  const structuredData = generateToolStructuredData('sql-tools');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <SqlTools />
      </div>
    </>
  );
}
