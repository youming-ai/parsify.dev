import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'lorem-ipsum',
});

const LoremIpsumGenerator = dynamic(
  () =>
    import('@/components/tools/generators/lorem-ipsum-generator').then((mod) => ({
      default: mod.default,
    })),
  {
    loading: () => <ToolLoading message="Loading Lorem Ipsum Generator..." />,
  }
);

export default function LoremIpsumPage() {
  const structuredData = generateToolStructuredData('lorem-ipsum');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="Lorem Ipsum generation is performed entirely in your browser. Your data never leaves your device." />
        <LoremIpsumGenerator />
      </div>
    </>
  );
}
