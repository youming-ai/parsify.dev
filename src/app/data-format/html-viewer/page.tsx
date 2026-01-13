import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'html-viewer',
});

const HTMLViewer = dynamic(
  () => import('@/components/tools/code/html-viewer').then((mod) => ({ default: mod.default })),
  {
    loading: () => <ToolLoading message="Loading HTML Viewer..." />,
  }
);

export default function HTMLViewerPage() {
  const structuredData = generateToolStructuredData('html-viewer');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="HTML rendering is performed entirely in your browser. Your HTML code never leaves your device." />
        <HTMLViewer />
      </div>
    </>
  );
}
