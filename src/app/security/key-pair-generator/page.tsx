import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'key-pair-generator',
  customTitle: 'Key Pair Generator - RSA, ECDSA, Ed25519 | Parsify',
  customDescription:
    'Generate RSA, ECDSA, or Ed25519 key pairs for encryption, authentication, and digital signatures. Keys are generated entirely in your browser.',
  extraKeywords: [
    'rsa',
    'ecdsa',
    'ed25519',
    'key-pair',
    'encryption',
    'public-key',
    'private-key',
    'pem',
  ],
});

const KeyPairGenerator = dynamic(
  () =>
    import('@/components/tools/security/key-pair-generator').then((mod) => ({
      default: mod.default,
    })),
  {
    loading: () => <ToolLoading message="Loading Key Pair Generator..." />,
  }
);

export default function KeyPairGeneratorPage() {
  const structuredData = generateToolStructuredData('key-pair-generator');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="Key pair generation is performed entirely in your browser. Your keys never leave your device." />
        <KeyPairGenerator />
      </div>
    </>
  );
}
