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

import { Eye } from 'lucide-react';
import { PixelToolHeader } from '@/components/tools/shared/pixel-tool-header';
// ... existing imports

export default function HtmlViewerPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <PixelToolHeader
        title="HTML VIEWER"
        description="Render HTML snippets securely in your browser with instant preview. What you see is what you get."
        category="Data Format"
        icon={<Eye className="h-8 w-8" />}
      />

      <div className="border-2 border-foreground/20 p-1 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] bg-card rounded-none">
        <HtmlViewer />
      </div>
    </div>
  );
}
