import { JsonLd } from '@/components/seo/json-ld';
import ColorConverter from '@/components/tools/converters/color-converter';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'color-tools',
});

export default function UcolorUtoolsPage() {
  const structuredData = generateToolStructuredData('color-tools');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <ColorConverter />
      </div>
    </>
  );
}
