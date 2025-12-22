import { JsonLd } from '@/components/seo/json-ld';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'cronjob-generator',
});

export default function UcronjobUgeneratorPage() {
  const structuredData = generateToolStructuredData('cronjob-generator');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Cronjob Generator</h1>
          <p className="text-muted-foreground">Tool component coming soon...</p>
        </div>
      </div>
    </>
  );
}
