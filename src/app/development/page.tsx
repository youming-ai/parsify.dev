import { CategoryView } from '@/components/layout/category-view';
import { generatePageMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata({
  title: 'Development & Testing Tools',
  description:
    'Professional development tools for text inspection, diff viewing, regex validation, ID generation, and more. Run securely in your browser.',
  path: '/development',
  keywords: [
    'diff viewer',
    'regex tester',
    'id generator',
    'text inspector',
    'lorem ipsum',
    'development tools',
  ],
});

export default function DevelopmentPage() {
  return <CategoryView categoryName="Development & Testing" categorySlug="development" />;
}
