import { JsonLd } from '@/components/seo/json-ld';
import MarkdownEditor from '@/components/tools/text/markdown-editor';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'markdown-editor',
  customTitle: 'Markdown Editor with Live Preview | Parsify',
  customDescription:
    'Edit and preview Markdown content with live rendering. Convert Markdown to HTML with GitHub Flavored Markdown support.',
  extraKeywords: ['markdown', 'editor', 'preview', 'gfm', 'html', 'converter', 'live-preview'],
});

export default function MarkdownEditorPage() {
  const structuredData = generateToolStructuredData('markdown-editor');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <MarkdownEditor />
      </div>
    </>
  );
}
