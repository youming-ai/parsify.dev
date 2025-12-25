import { CategoryView } from '@/components/layout/category-view';
import { generatePageMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata({
  title: 'Network & Utility Tools',
  description:
    'Professional network and utility tools for URL parsing, DNS lookup, color conversion, and timestamps. All tools run locally in your browser for maximum privacy.',
  path: '/network',
  keywords: ['url parser', 'dns lookup', 'color converter', 'timestamp converter', 'network tools'],
});

export default function NetworkPage() {
  return <CategoryView categoryName="Network & Utility" categorySlug="network" />;
}
