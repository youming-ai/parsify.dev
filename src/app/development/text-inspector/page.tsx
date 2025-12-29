import { JsonLd } from '@/components/seo/json-ld';
import { TextInspector } from '@/components/tools/text/text-inspector';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'text-inspector',
});

export default function TextInspectorPage() {
  const structuredData = generateToolStructuredData('text-inspector');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <TextInspector />
      </div>
    </>
  );
}
