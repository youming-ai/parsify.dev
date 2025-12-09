import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SQL Formatter & Validator - Format SQL Queries Online',
  description:
    'Free online SQL formatter and validator. Format, beautify, and validate SQL queries with syntax highlighting. Supports SELECT, INSERT, CREATE, and more.',
  keywords: [
    'sql formatter',
    'sql beautifier',
    'sql validator',
    'format sql online',
    'sql query formatter',
    'sql syntax',
    'database query',
  ],
  openGraph: {
    title: 'SQL Formatter & Validator - Parsify.dev',
    description: 'Format and validate SQL queries online. Free and runs in your browser.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
