import DNSLookup from '@/components/tools/network/dns-lookup';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DNS Lookup - Query DNS Records Online (A, MX, TXT, CNAME)',
  description:
    'Free online DNS lookup tool. Query DNS records including A, AAAA, MX, TXT, CNAME, NS, and SOA records for any domain with TTL information.',
  keywords: [
    'dns lookup',
    'dns records',
    'mx lookup',
    'txt records',
    'cname lookup',
    'domain lookup',
    'dns query',
  ],
  openGraph: {
    title: 'DNS Lookup - Parsify.dev',
    description: 'Query DNS records for any domain with comprehensive record type support.',
  },
};

import { PixelToolHeader } from '@/components/tools/shared/pixel-tool-header';
import { Globe } from 'lucide-react';

export default function DNSLookupPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <PixelToolHeader
        title="DNS LOOKUP"
        description="Query DNS records including A, AAAA, MX, TXT, CNAME, NS, and SOA records for any domain with TTL information."
        category="Network & Web"
        icon={<Globe className="h-8 w-8" />}
      />
      <DNSLookup />
    </div>
  );
}
