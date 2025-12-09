import PasswordGenerator from '@/components/tools/security/password-generator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Password Generator & Strength Checker | Parsify',
  description:
    'Generate strong, secure passwords with comprehensive strength analysis, entropy calculation, and security recommendations.',
  keywords: [
    'password generator',
    'password strength',
    'security',
    'entropy',
    'authentication',
    'crack time',
    'password analyzer',
  ],
  openGraph: {
    title: 'Password Generator & Strength Checker',
    description: 'Generate strong passwords with comprehensive security analysis',
    type: 'website',
  },
};

export default function PasswordGeneratorPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <PasswordGenerator />
    </div>
  );
}
