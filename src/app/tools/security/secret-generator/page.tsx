import SecretGenerator from '@/components/tools/security/secret-generator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secret Generator | Parsify',
  description: 'Create strong API keys and secrets with customizable rules.',
};

export default function SecretGeneratorPage() {
  return (
    <div className="container mx-auto py-8">
      <SecretGenerator />
    </div>
  );
}
