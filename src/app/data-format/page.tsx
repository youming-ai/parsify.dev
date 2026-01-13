import { CategoryView } from '@/components/layout/category-view';
import { generatePageMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata({
  title: 'Data Format & Conversion Tools',
  description:
    'Professional data format and conversion tools for JSON, Base64, HTML, SQL, and more. Format, validate, and convert data with browser-based privacy.',
  path: '/data-format',
  keywords: [
    'json formatter',
    'base64 encoder',
    'html formatter',
    'sql formatter',
    'data conversion',
    'markdown editor',
  ],
});

export default function DataFormatPage() {
  return <CategoryView categoryName="Data Format & Conversion" />;
}
