import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ID Generator - Generate UUID, ULID, NanoID Online',
  description:
    'Free online ID generator. Generate UUIDs (v1, v4, v7), ULIDs, Nano IDs, and KSUIDs with batch generation. All processing runs locally in your browser.',
  keywords: [
    'uuid generator',
    'ulid generator',
    'nanoid generator',
    'guid generator',
    'unique id generator',
    'uuid v4',
    'uuid v7',
    'ksuid',
  ],
  openGraph: {
    title: 'ID Generator - Parsify.dev',
    description: 'Generate UUIDs, ULIDs, Nano IDs, and more unique identifiers instantly.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
