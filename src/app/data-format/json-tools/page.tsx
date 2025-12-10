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

import { FileJson } from 'lucide-react';
import { PixelToolHeader } from '@/components/tools/shared/pixel-tool-header';
// ... existing imports

export default function JsonFormatterPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <PixelToolHeader
        title="JSON MASTER"
        description="Advanced JSON toolkit: Format, Validate, Minify and Analyze. Client-side processing ensures 100% privacy."
        category="Data Format"
        icon={<FileJson className="h-8 w-8" />}
      />

      <div className="relative">
        {/* Pixel connection lines */}
        <div className="absolute -top-6 left-8 w-1 h-6 bg-foreground/20"></div>
        <div className="absolute -top-6 right-8 w-1 h-6 bg-foreground/20"></div>

        <JsonToolComplete
          showHeader={false}
          className="border-2 border-foreground/20 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] rounded-none"
        />
      </div>
    </div>
  );
}
