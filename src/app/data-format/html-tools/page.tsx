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

export default function HtmlToolsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <HtmlTools />
    </div>
  );
}
