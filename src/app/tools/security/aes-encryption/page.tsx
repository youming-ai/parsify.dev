import { AESEncryption } from '@/components/tools/security/aes-encryption';
import { ToolInfoSection } from '@/components/tools/tool-info-section';
import { Hash, Key, Lock, Shield } from 'lucide-react';

export default function AesEncryptionPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <AESEncryption />

      <ToolInfoSection
        features={[
          'AES-256-GCM encryption algorithm',
          'Password-based key derivation (PBKDF2)',
          'Base64 output format for easy sharing',
          'Encrypt text, JSON, or any string data',
          'Decrypt previously encrypted content',
          'Client-side only - your data never leaves',
        ]}
        info={{
          category: 'Security Tools',
          processing: 'Client Side',
          security: 'Local Only',
          difficulty: 'Intermediate',
        }}
        related={[
          {
            name: 'Password Generator',
            description: 'Generate strong, secure passwords',
            href: '/tools/security/password-generator',
            icon: <Key className="h-5 w-5" />,
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
            icon: <Shield className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
}

export const metadata = {
  title: 'AES Encryption Tool - Parsify',
  description: 'Encrypt and decrypt data using AES encryption',
};
