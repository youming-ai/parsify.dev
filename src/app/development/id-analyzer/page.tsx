import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'id-analyzer',
  customTitle: 'ID Analyzer - UUID, ULID, ObjectId Decoder | Parsify',
  customDescription:
    'Analyze and decode UUIDs, GUIDs, ULIDs, Nano IDs, MongoDB ObjectIDs and Snowflake IDs. Get detailed breakdowns and metadata.',
  extraKeywords: ['uuid', 'ulid', 'guid', 'objectid', 'nanoid', 'snowflake', 'decoder'],
});

const IDAnalyzer = dynamic(
  () => import('@/components/tools/security/id-analyzer').then((mod) => ({ default: mod.default })),
  {
    loading: () => <ToolLoading message="Loading ID Analyzer..." />,
  }
);

export default function IDAnalyzerPage() {
  const structuredData = generateToolStructuredData('id-analyzer');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="ID analysis is performed entirely in your browser. Your IDs never leave your device." />
        <IDAnalyzer />
      </div>
    </>
  );
}
