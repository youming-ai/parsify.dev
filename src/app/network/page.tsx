import { CategoryView } from '@/components/layout/category-view';
import { generatePageMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata({
  title: 'Network & Web Tools',
  description:
    'Professional network utilities for URL parsing, DNS lookup, and web development. All tools run locally in your browser for maximum privacy.',
  path: '/network',
  keywords: ['url parser', 'dns lookup', 'network tools', 'web utilities', 'ip lookup'],
});

export default function NetworkPage() {
  return <CategoryView categoryName="Network & Web" categorySlug="network" />;
}
