import IDAnalyzer from '@/components/tools/security/id-analyzer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ID Analyzer | Parsify',
  description: 'Inspect and decode UUID, ULID, ObjectId, and Snowflake identifiers.',
};

export default function IDAnalyzerPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <IDAnalyzer />
    </div>
  );
}
