import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'password-generator',
  customTitle: 'Password Generator & Strength Checker | Parsify',
  customDescription:
    'Generate strong, secure passwords with comprehensive strength analysis, entropy calculation, and security recommendations.',
  extraKeywords: ['security', 'entropy', 'authentication', 'crack time', 'password analyzer'],
});

const PasswordGenerator = dynamic(
  () =>
    import('@/components/tools/security/password-generator').then((mod) => ({
      default: mod.default,
    })),
  {
    loading: () => <ToolLoading message="Loading Password Generator..." />,
  }
);

export default function PasswordGeneratorPage() {
  const structuredData = generateToolStructuredData('password-generator');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="Password generation is performed entirely in your browser. Your passwords never leaves your device." />
        <PasswordGenerator />
      </div>
    </>
  );
}
