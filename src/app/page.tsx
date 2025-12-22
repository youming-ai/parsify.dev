import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Parsify.dev - Professional Developer Tools',
  description:
    'A privacy-first collection of utilities for your daily workflow. No server-side processing—your data never leaves your browser. Format JSON, generate IDs, convert colors, and more.',
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return <HomeClient />;
}
