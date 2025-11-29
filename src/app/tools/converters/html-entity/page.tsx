import { HtmlEntityEncoder } from '@/components/tools/converters/html-entity-encoder';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HTML Entity Encoder | Parsify',
  description: 'Encode and decode HTML entities and special characters.',
};

export default function HtmlEntityPage() {
  return (
    <div className="container mx-auto py-8">
      <HtmlEntityEncoder />
    </div>
  );
}
