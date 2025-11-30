import { HtmlViewer } from '@/components/tools/code/html-viewer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HTML Viewer | Parsify',
  description: 'Preview and render HTML snippets securely in your browser.',
};

export default function HtmlViewerPage() {
  return (
    <div className="container mx-auto py-8">
      <HtmlViewer />
    </div>
  );
}
