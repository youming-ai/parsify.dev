import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'sql-tools',
});

const SqlTools = dynamic(
  () => import('@/components/tools/code/sql-tools').then((mod) => ({ default: mod.SqlTools })),
  {
    loading: () => <ToolLoading message="Loading SQL Tools..." />,
  }
);

export default function SQLToolsPage() {
  const structuredData = generateToolStructuredData('sql-tools');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="SQL processing is performed entirely in your browser. Your SQL code never leaves your device." />
        <SqlTools />
      </div>
    </>
  );
}
