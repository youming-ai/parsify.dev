import { CronParser } from '@/components/tools/utilities/cron-parser';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cron Parser | Parsify',
  description: 'Parse cron expressions and preview next run times.',
};

export default function CronParserPage() {
  return (
    <div className="container mx-auto py-8">
      <CronParser />
    </div>
  );
}
