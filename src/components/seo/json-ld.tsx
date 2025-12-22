import type { StructuredData } from '@/types/seo';

interface JsonLdProps {
  data: StructuredData;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
