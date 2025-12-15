import SecretGenerator from '@/components/tools/security/secret-generator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secret & API Key Generator - Generate Secure Keys Online',
  description:
    'Free online secret and API key generator. Create strong, random secrets for API keys, JWT secrets, encryption keys, and more. 100% client-side generation.',
  keywords: [
    'api key generator',
    'secret generator',
    'jwt secret',
    'encryption key',
    'random string',
    'secure token',
    'api token generator',
  ],
  openGraph: {
    title: 'Secret & API Key Generator - Parsify.dev',
    description: 'Generate secure API keys and secrets for your applications.',
  },
};

export default function SecretGeneratorPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
      <SecretGenerator />
    </div>
  );
}
