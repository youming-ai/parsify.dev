import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'compression-tools',
});

const CompressionTool = dynamic(
  () =>
    import('@/components/tools/utilities/compression-tool').then((mod) => ({
      default: mod.default,
    })),
  {
    loading: () => <ToolLoading message="Loading Compression Tools..." />,
  }
);

export default function CompressionToolsPage() {
  const structuredData = generateToolStructuredData('compression-tools');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="Compression/decompression is performed entirely in your browser. Your data never leaves your device." />
        <CompressionTool />
      </div>
    </>
  );
}
