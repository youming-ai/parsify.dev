import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'regex-validator',
});

const RegexValidator = dynamic(
  () =>
    import('@/components/tools/code/regex-validator').then((mod) => ({
      default: mod.RegexValidator,
    })),
  {
    loading: () => <ToolLoading message="Loading Regex Validator..." />,
  }
);

export default function RegexValidatorPage() {
  const structuredData = generateToolStructuredData('regex-validator');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="Regex validation is performed entirely in your browser. Your patterns and text never leave your device." />
        <RegexValidator />
      </div>
    </>
  );
}
