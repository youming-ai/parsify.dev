import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'html-tools',
});

const HTMLTools = dynamic(
  () => import('@/components/tools/code/html-tools').then((mod) => ({ default: mod.default })),
  {
    loading: () => <ToolLoading message="Loading HTML Tools..." />,
  }
);

export default function HTMLToolsPage() {
  const structuredData = generateToolStructuredData('html-tools');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="HTML processing is performed entirely in your browser. Your HTML code never leaves your device." />
        <HTMLTools />
      </div>
    </>
  );
}
