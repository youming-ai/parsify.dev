import { JsonLd } from '@/components/seo/json-ld';
import DiffViewer from '@/components/tools/code/diff-viewer';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'diff-viewer',
  customTitle: 'Diff Viewer - Compare Text & Code | Parsify',
  customDescription:
    'Compare and edit text or code side-by-side. See all changes and differences highlighted in real time.',
  extraKeywords: ['diff', 'compare', 'merge', 'text', 'code', 'side-by-side', 'unified'],
});

export default function DiffViewerPage() {
  const structuredData = generateToolStructuredData('diff-viewer');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <DiffViewer />
      </div>
    </>
  );
}
