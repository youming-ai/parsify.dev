import { JsonLd } from '@/components/seo/json-ld';
import HTMLViewer from '@/components/tools/code/html-viewer';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'html-viewer',
});

export default function UhtmlUviewerPage() {
  const structuredData = generateToolStructuredData('html-viewer');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <HTMLViewer />
      </div>
    </>
  );
}
