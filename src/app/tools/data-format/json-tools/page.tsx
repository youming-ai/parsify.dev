import { ToolPageLayout } from '@/components/layout/tool-page-layout';
import { JsonToolComplete } from '@/components/tools/json/json-tool-complete';
import { FileJson } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON Formatter & Validator - Format, Beautify, Validate JSON Online',
  description:
    'Free online JSON formatter and validator. Format, beautify, minify and validate JSON data with syntax highlighting. Runs entirely in your browser with no data sent to servers.',
  keywords: [
    'json formatter',
    'json validator',
    'json beautifier',
    'json minifier',
    'json parser',
    'json viewer',
    'format json online',
    'validate json',
  ],
  openGraph: {
    title: 'JSON Formatter & Validator - Parsify.dev',
    description:
      'Format, beautify, and validate JSON data online. Free, secure, and privacy-focused.',
  },
};

export default function JsonFormatterPage() {
  return (
    <ToolPageLayout
      title="JSON Formatter"
      description="Format, beautify, and validate JSON data with customizable indentation and sorting options"
      icon={<FileJson className="h-8 w-8" />}
    >
      <JsonToolComplete showHeader={false} />
    </ToolPageLayout>
  );
}
