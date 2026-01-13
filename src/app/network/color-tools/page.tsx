import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'color-tools',
});

const ColorConverter = dynamic(
  () =>
    import('@/components/tools/converters/color-converter').then((mod) => ({
      default: mod.default,
    })),
  {
    loading: () => <ToolLoading message="Loading Color Converter..." />,
  }
);

export default function ColorToolsPage() {
  const structuredData = generateToolStructuredData('color-tools');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="Color conversion is performed entirely in your browser. Your colors never leave your device." />
        <ColorConverter />
      </div>
    </>
  );
}
