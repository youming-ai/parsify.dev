import { JsonToolComplete } from '@/components/tools/json/json-tool-complete';
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
// ... existing imports

export default function JsonFormatterPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
      <div className="relative">
        <JsonToolComplete showHeader={false} className="rounded-xl border shadow-sm" />
      </div>
    </div>
  );
}
