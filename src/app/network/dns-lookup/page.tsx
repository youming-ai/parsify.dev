import { JsonLd } from '@/components/seo/json-ld';
import DNSLookup from '@/components/tools/network/dns-lookup';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'dns-lookup',
});

export default function UdnsUlookupPage() {
  const structuredData = generateToolStructuredData('dns-lookup');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <DNSLookup />
      </div>
    </>
  );
}
