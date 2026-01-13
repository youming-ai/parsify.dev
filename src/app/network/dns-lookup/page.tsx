import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'dns-lookup',
});

const DNSLookup = dynamic(
  () => import('@/components/tools/network/dns-lookup').then((mod) => ({ default: mod.default })),
  {
    loading: () => <ToolLoading message="Loading DNS Lookup..." />,
  }
);

export default function DNSLookupPage() {
  const structuredData = generateToolStructuredData('dns-lookup');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="DNS lookup is performed entirely in your browser. Your queries never leave your device." />
        <DNSLookup />
      </div>
    </>
  );
}
