import { JsonLd } from '@/components/seo/json-ld';
import { JsonToolComplete } from '@/components/tools/json/json-tool-complete';
import { toolsData } from '@/data/tools-data';
import { generatePageMetadata } from '@/lib/metadata';
import { generateStructuredData } from '@/lib/structured-data';
import type { Metadata } from 'next';

const tool = toolsData.find((t) => t.id === 'json-tools')!;
const BASE_URL = 'https://parsify.dev';

export const metadata: Metadata = generatePageMetadata({
  title: 'JSON Formatter & Validator - Format, Beautify, Validate JSON Online',
  description:
    'Free online JSON formatter and validator. Format, beautify, minify and validate JSON data with syntax highlighting. Runs entirely in your browser with no data sent to servers.',
  path: '/data-format/json-tools',
  keywords: [
    'json formatter',
    'json validator',
    'json beautifier',
    'json minifier',
    'json parser',
    'json viewer',
    'format json online',
    'validate json',
  ],
});
// ... existing imports

export default function JsonFormatterPage() {
  const structuredData = [
    generateStructuredData({
      type: 'SoftwareApplication',
      name: tool.name,
      description: tool.description,
      url: `${BASE_URL}${tool.href}`,
      tool,
    }),
    generateStructuredData({
      type: 'WebPage',
      name: `${tool.name} - ${tool.description}`,
      description: tool.description,
      url: `${BASE_URL}${tool.href}`,
      breadcrumb: [
        { name: 'Home', url: BASE_URL },
        { name: 'Data Format & Conversion', url: `${BASE_URL}/data-format` },
        { name: tool.name, url: `${BASE_URL}${tool.href}` },
      ],
    }),
  ];

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="relative">
          <JsonToolComplete showHeader={false} className="rounded-xl border shadow-sm" />
        </div>
      </div>
    </>
  );
}
