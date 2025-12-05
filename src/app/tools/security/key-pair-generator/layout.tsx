import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RSA Key Pair Generator - Generate Public/Private Keys Online',
  description:
    'Free online RSA key pair generator. Generate secure RSA public and private keys with customizable key sizes (1024, 2048, 4096 bits). All keys are generated locally in your browser.',
  keywords: [
    'rsa key generator',
    'key pair generator',
    'public key',
    'private key',
    'rsa encryption',
    'generate rsa keys',
    'asymmetric encryption',
    'pem format',
  ],
  openGraph: {
    title: 'RSA Key Pair Generator - Parsify.dev',
    description:
      'Generate secure RSA key pairs for encryption and digital signatures. 100% client-side.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
