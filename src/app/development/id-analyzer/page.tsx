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

import { PixelToolHeader } from '@/components/tools/shared/pixel-tool-header';
import { Fingerprint } from 'lucide-react';

export default function IDAnalyzerPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <PixelToolHeader
        title="ID ANALYZER"
        description="Inspect and decode UUID, ULID, GUID, Nano ID, MongoDB ObjectId, and Snowflake identifiers."
        category="Development"
        icon={<Fingerprint className="h-8 w-8" />}
      />
      <IDAnalyzer />
    </div>
  );
}
