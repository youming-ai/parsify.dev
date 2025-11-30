import PasswordGenerator from '@/components/tools/security/password-generator';
import { ToolInfoSection } from '@/components/tools/tool-info-section';
import { Hash, Key, Lock, Shield } from 'lucide-react';
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

      <ToolInfoSection
        features={[
          'Customizable password length (8-128 characters)',
          'Include uppercase, lowercase, numbers, symbols',
          'Real-time password strength analysis',
          'Entropy calculation and crack time estimation',
          'Avoid ambiguous characters option',
          'One-click copy to clipboard',
        ]}
        info={{
          category: 'Security Tools',
          processing: 'Client Side',
          security: 'Local Only',
          difficulty: 'Beginner',
        }}
        related={[
          {
            name: 'AES Encryption',
            description: 'Encrypt and decrypt data using AES algorithm',
            href: '/tools/security/aes-encryption',
            icon: <Lock className="h-5 w-5" />,
          },
          {
            name: 'Hash Generator',
            description: 'Generate cryptographic hashes (MD5, SHA-256)',
            href: '/tools/data/hash-generator',
            icon: <Hash className="h-5 w-5" />,
          },
          {
            name: 'Secret Generator',
            description: 'Generate secure API keys and secrets',
            href: '/tools/security/secret-generator',
            icon: <Key className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
}
