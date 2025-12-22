import { JsonLd } from '@/components/seo/json-ld';
import PasswordGenerator from '@/components/tools/security/password-generator';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'password-generator',
  customTitle: 'Password Generator & Strength Checker | Parsify',
  customDescription:
    'Generate strong, secure passwords with comprehensive strength analysis, entropy calculation, and security recommendations.',
  extraKeywords: ['security', 'entropy', 'authentication', 'crack time', 'password analyzer'],
});

export default function PasswordGeneratorPage() {
  const structuredData = generateToolStructuredData('password-generator');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PasswordGenerator />
      </div>
    </>
  );
}
