import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'diff-viewer',
  customTitle: 'Diff Viewer - Compare Text & Code | Parsify',
  customDescription:
    'Compare and edit text or code side-by-side. See all changes and differences highlighted in real time.',
  extraKeywords: ['diff', 'compare', 'merge', 'text', 'code', 'side-by-side', 'unified'],
});

const DiffViewer = dynamic(
  () => import('@/components/tools/code/diff-viewer').then((mod) => ({ default: mod.default })),
  {
    loading: () => <ToolLoading message="Loading Diff Viewer..." />,
  }
);

export default function DiffViewerPage() {
  const structuredData = generateToolStructuredData('diff-viewer');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="Diff comparison is performed entirely in your browser. Your code never leaves your device." />
        <DiffViewer />
      </div>
    </>
  );
}
