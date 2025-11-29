import IDAnalyzer from '@/components/tools/security/id-analyzer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ID Analyzer | Parsify',
  description: 'Inspect and decode UUID, ULID, ObjectId, and Snowflake identifiers.',
};

export default function IDAnalyzerPage() {
  return (
    <div className="container mx-auto py-8">
      <IDAnalyzer />
    </div>
  );
}
