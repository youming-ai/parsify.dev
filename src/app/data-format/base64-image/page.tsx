import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'base64-image',
});

const Base64ImageConverter = dynamic(
  () =>
    import('@/components/tools/image/base64-image-converter').then((mod) => ({
      default: mod.default,
    })),
  {
    loading: () => <ToolLoading message="Loading Base64 Image Converter..." />,
  }
);

export default function Base64ImagePage() {
  const structuredData = generateToolStructuredData('base64-image');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="Base64 image encoding/decoding is performed entirely in your browser. Your images never leave your device." />
        <Base64ImageConverter />
      </div>
    </>
  );
}
