import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'json-tools',
  customTitle: 'JSON Formatter & Validator - Format, Beautify, Validate JSON Online',
  customDescription:
    'Free online JSON formatter and validator. Format, beautify, minify and validate JSON data with syntax highlighting. Runs entirely in your browser with no data sent to servers.',
  extraKeywords: [
    'json beautifier',
    'json minifier',
    'json parser',
    'json viewer',
    'format json online',
    'validate json',
  ],
});

const JsonToolComplete = dynamic(
  () =>
    import('@/components/tools/json/json-tool-complete').then((mod) => ({
      default: mod.JsonToolComplete,
    })),
  {
    loading: () => <ToolLoading message="Loading JSON Tools..." />,
  }
);

export default function JsonToolsPage() {
  const structuredData = generateToolStructuredData('json-tools');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="JSON processing is performed entirely in your browser. Your JSON data never leaves your device." />
        <div className="relative">
          <JsonToolComplete showHeader={false} className="rounded-xl border shadow-sm" />
        </div>
      </div>
    </>
  );
}
