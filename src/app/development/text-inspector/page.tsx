import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'text-inspector',
});

const TextInspector = dynamic(
  () =>
    import('@/components/tools/text/text-inspector').then((mod) => ({
      default: mod.TextInspector,
    })),
  {
    loading: () => <ToolLoading message="Loading Text Inspector..." />,
  }
);

export default function TextInspectorPage() {
  const structuredData = generateToolStructuredData('text-inspector');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="Text analysis is performed entirely in your browser. Your text never leaves your device." />
        <TextInspector />
      </div>
    </>
  );
}
