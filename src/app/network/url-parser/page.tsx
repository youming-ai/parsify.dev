import { ToolBreadcrumb } from '@/components/layout/breadcrumb';
import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { URLEncoderDocs } from '@/components/tools/utilities/url-encoder-docs';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'url-parser',
});

const URLEncoder = dynamic(
  () =>
    import('@/components/tools/utilities/url-encoder').then((mod) => ({ default: mod.URLEncoder })),
  {
    loading: () => <ToolLoading message="Loading URL Encoder..." />,
  }
);

export default function URLEncoderPage() {
  const structuredData = generateToolStructuredData('url-parser');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <ToolBreadcrumb
          toolName="URL Parser"
          category="Network & Utility"
          categoryHref="/network"
          className="mb-6"
        />
        <PrivacyNotice message="URL parsing is performed entirely in your browser. Your data never leaves your device." />
        <div className="space-y-6">
          <URLEncoder />
          <URLEncoderDocs />
        </div>
      </div>
    </>
  );
}
