import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hash Generator - MD5, SHA256, SHA512 Hash Online',
  description:
    'Free online hash generator. Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 hashes for text and files. Secure, client-side processing with no data uploaded.',
  keywords: [
    'hash generator',
    'md5 hash',
    'sha256 hash',
    'sha512 hash',
    'sha1 hash',
    'checksum generator',
    'file hash',
    'hash calculator',
  ],
  openGraph: {
    title: 'Hash Generator - Parsify.dev',
    description: 'Generate MD5, SHA-256, and SHA-512 hashes for text and files. 100% client-side.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
