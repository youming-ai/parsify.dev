import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Markdown Editor - Write & Preview Markdown Online',
  description:
    'Free online Markdown editor with live preview. Write, edit, and export Markdown with GitHub Flavored Markdown support. Runs entirely in your browser.',
  keywords: [
    'markdown editor',
    'markdown preview',
    'markdown to html',
    'github flavored markdown',
    'gfm editor',
    'online markdown',
    'markdown converter',
  ],
  openGraph: {
    title: 'Markdown Editor - Parsify.dev',
    description:
      'Write and preview Markdown with live preview and GitHub Flavored Markdown support.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
