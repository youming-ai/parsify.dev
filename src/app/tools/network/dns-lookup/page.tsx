import DNSLookup from '@/components/tools/network/dns-lookup';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DNS Lookup | Parsify',
  description: 'Query DNS records (A, AAAA, MX, TXT, CNAME) quickly.',
};

export default function DNSLookupPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <DNSLookup />
    </div>
  );
}
