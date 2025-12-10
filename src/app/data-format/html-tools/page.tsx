import { HtmlTools } from '@/components/tools/code/html-tools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HTML Formatter & Minifier - Format, Validate HTML Online',
  description:
    'Free online HTML formatter and minifier. Format, beautify, minify, and validate HTML code. Encode and decode HTML entities quickly.',
  keywords: [
    'html formatter',
    'html minifier',
    'html beautifier',
    'html validator',
    'html entities',
    'format html online',
  ],
  openGraph: {
    title: 'HTML Formatter & Minifier - Parsify.dev',
    description: 'Format, minify, and validate HTML code with entity encoding.',
  },
};

import { Code } from 'lucide-react';
import { PixelToolHeader } from '@/components/tools/shared/pixel-tool-header';
// ... existing imports

export default function HtmlToolsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <PixelToolHeader
        title="HTML STUDIO"
        description="Format, minify, and validate HTML code with entity encoding. Pixel-perfect code formatting."
        category="Data Format"
        icon={<Code className="h-8 w-8" />}
      />

      <div className="border-2 border-foreground/20 p-1 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] bg-card rounded-none">
        <HtmlTools />
      </div>
    </div>
  );
}
