import IDAnalyzer from '@/components/tools/security/id-analyzer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ID Analyzer - Decode UUID, ULID, ObjectId Online',
  description:
    'Free online ID analyzer. Inspect and decode UUID, ULID, GUID, Nano ID, MongoDB ObjectId, and Snowflake identifiers with detailed breakdowns.',
  keywords: [
    'uuid analyzer',
    'ulid decoder',
    'objectid decoder',
    'snowflake id',
    'guid parser',
    'id inspector',
    'nanoid analyzer',
  ],
  openGraph: {
    title: 'ID Analyzer - Parsify.dev',
    description: 'Decode and analyze UUID, ULID, ObjectId, and other ID formats.',
  },
};

export default function IDAnalyzerPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <IDAnalyzer />
    </div>
  );
}
