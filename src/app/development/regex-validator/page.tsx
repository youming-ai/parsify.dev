import { JsonLd } from '@/components/seo/json-ld';
import { RegexValidator } from '@/components/tools/code/regex-validator';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'regex-validator',
});

export default function RegexValidatorPage() {
  const structuredData = generateToolStructuredData('regex-validator');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <RegexValidator />
      </div>
    </>
  );
}
