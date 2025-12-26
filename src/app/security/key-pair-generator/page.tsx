import { JsonLd } from '@/components/seo/json-ld';
import KeyPairGenerator from '@/components/tools/security/key-pair-generator';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

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

export default function KeyPairGeneratorPage() {
  const structuredData = generateToolStructuredData('key-pair-generator');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <KeyPairGenerator />
      </div>
    </>
  );
}
