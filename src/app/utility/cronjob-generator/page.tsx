import { CronParser } from '@/components/tools/utilities/cron-parser';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cron Expression Generator & Parser - Build Cron Jobs Online',
  description:
    'Free online cron expression generator and parser. Build, validate, and preview cron schedules with human-readable descriptions and next run times.',
  keywords: [
    'cron generator',
    'cron parser',
    'cron expression',
    'crontab',
    'cron schedule',
    'cron builder',
    'job scheduler',
  ],
  openGraph: {
    title: 'Cron Expression Generator - Parsify.dev',
    description: 'Build and validate cron expressions with next run time preview.',
  },
};

import { PixelToolHeader } from '@/components/tools/shared/pixel-tool-header';
import { Clock } from 'lucide-react';

export default function CronParserPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <PixelToolHeader
        title="CRON EXPRESSION GENERATOR"
        description="Build, validate, and preview cron schedules with human-readable descriptions and next run times."
        category="Utility"
        icon={<Clock className="h-8 w-8" />}
      />
      <CronParser />
    </div>
  );
}
