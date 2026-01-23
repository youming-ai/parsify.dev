import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'cron-parser',
});

const CronParser = dynamic(
  () =>
    import('@/components/tools/utilities/cron-parser').then((mod) => ({
      default: mod.default,
    })),
  {
    loading: () => <ToolLoading message="Loading Cron Parser..." />,
  }
);

export default function CronParserPage() {
  const structuredData = generateToolStructuredData('cron-parser');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="Cron expression parsing is performed entirely in your browser. Your data never leaves your device." />
        <CronParser />
      </div>
    </>
  );
}
