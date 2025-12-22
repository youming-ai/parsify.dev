import { CategoryView } from '@/components/layout/category-view';
import { generatePageMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata({
  title: 'Security & Authentication Tools',
  description:
    'Professional security tools for password generation, JWT decoding, hash generation, encryption, and key pair generation. All processing happens locally in your browser.',
  path: '/security',
  keywords: [
    'password generator',
    'jwt decoder',
    'hash generator',
    'encryption tools',
    'key pair generator',
    'security tools',
  ],
});

export default function SecurityPage() {
  return <CategoryView categoryName="Security & Authentication" categorySlug="security" />;
}
