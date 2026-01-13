import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'secret-generator',
});

const SecretGenerator = dynamic(
  () =>
    import('@/components/tools/security/secret-generator').then((mod) => ({
      default: mod.default,
    })),
  {
    loading: () => <ToolLoading message="Loading Secret Generator..." />,
  }
);

export default function SecretGeneratorPage() {
  const structuredData = generateToolStructuredData('secret-generator');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="Secret generation is performed entirely in your browser. Your secrets never leave your device." />
        <SecretGenerator />
      </div>
    </>
  );
}
