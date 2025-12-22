import { CategoryView } from '@/components/layout/category-view';
import { generatePageMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata({
  title: 'Utility Tools',
  description:
    'Professional utility tools for color conversion, timestamps, cron job generation, and more. Browser-based tools with no data sent to servers.',
  path: '/utility',
  keywords: ['color converter', 'timestamp converter', 'cron generator', 'utility tools'],
});

export default function UtilityPage() {
  return <CategoryView categoryName="Utility" categorySlug="utility" />;
}
