import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'URL Parser & Encoder - Parse & Encode URLs Online',
  description:
    'Free online URL parser and encoder. Parse URL components, encode/decode URLs, and edit query parameters. Perfect for web development and API testing.',
  keywords: [
    'url parser',
    'url encoder',
    'url decoder',
    'parse url online',
    'url query string',
    'encode url',
    'decode url',
    'percent encoding',
  ],
  openGraph: {
    title: 'URL Parser & Encoder - Parsify.dev',
    description: 'Parse, encode, and decode URLs online. Edit query parameters easily.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
