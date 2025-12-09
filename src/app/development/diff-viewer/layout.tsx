import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Diff Viewer - Compare Text & Code Differences Online',
  description:
    'Free online diff viewer and text comparison tool. Compare code and text side-by-side with highlighted differences. Perfect for code reviews and document comparison.',
  keywords: [
    'diff viewer',
    'text diff',
    'code comparison',
    'compare text online',
    'side by side diff',
    'file diff',
    'code diff tool',
  ],
  openGraph: {
    title: 'Diff Viewer - Parsify.dev',
    description: 'Compare text and code differences side-by-side with live highlighting.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
