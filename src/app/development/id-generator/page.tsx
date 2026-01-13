import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'id-generator',
});

const IdGenerator = dynamic(
  () =>
    import('@/components/tools/generators/id-generator').then((mod) => ({
      default: mod.IdGenerator,
    })),
  {
    loading: () => <ToolLoading message="Loading ID Generator..." />,
  }
);

export default function IDGeneratorPage() {
  const structuredData = generateToolStructuredData('id-generator');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="ID generation is performed entirely in your browser. Your data never leaves your device." />
        <IdGenerator />
      </div>
    </>
  );
}
