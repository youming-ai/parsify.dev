import { HtmlViewer } from '@/components/tools/code/html-viewer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HTML Viewer - Preview & Render HTML Online',
  description:
    'Free online HTML viewer and preview tool. Render HTML snippets securely in your browser with instant preview. Perfect for testing HTML code.',
  keywords: [
    'html viewer',
    'html preview',
    'render html',
    'html sandbox',
    'html tester',
    'live html preview',
  ],
  openGraph: {
    title: 'HTML Viewer - Parsify.dev',
    description: 'Preview and render HTML code securely in your browser.',
  },
};
// ... existing imports

export default function HtmlViewerPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
      <div className="rounded-xl border shadow-sm">
        <HtmlViewer />
      </div>
    </div>
  );
}
