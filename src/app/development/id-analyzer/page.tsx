import { JsonLd } from '@/components/seo/json-ld';
import IDAnalyzer from '@/components/tools/security/id-analyzer';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'id-analyzer',
  customTitle: 'ID Analyzer - UUID, ULID, ObjectId Decoder | Parsify',
  customDescription:
    'Analyze and decode UUIDs, GUIDs, ULIDs, Nano IDs, MongoDB ObjectIDs and Snowflake IDs. Get detailed breakdowns and metadata.',
  extraKeywords: ['uuid', 'ulid', 'guid', 'objectid', 'nanoid', 'snowflake', 'decoder'],
});

export default function IDAnalyzerPage() {
  const structuredData = generateToolStructuredData('id-analyzer');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <IDAnalyzer />
      </div>
    </>
  );
}
