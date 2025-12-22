import { JsonLd } from '@/components/seo/json-ld';
import Base64ImageConverter from '@/components/tools/image/base64-image-converter';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'base64-image',
});

export default function Ubase64UimagePage() {
  const structuredData = generateToolStructuredData('base64-image');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <Base64ImageConverter />
      </div>
    </>
  );
}
