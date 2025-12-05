import { HtmlTools } from '@/components/tools/code/html-tools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HTML Tools | Parsify',
  description: 'Format, minify, validate, and encode HTML quickly.',
};

export default function HtmlToolsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <HtmlTools />
    </div>
  );
}
