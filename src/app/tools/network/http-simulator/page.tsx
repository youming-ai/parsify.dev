import { HTTPRequestSimulator } from '@/components/tools/network/http-request-simulator';
import { ToolInfoSection } from '@/components/tools/tool-info-section';
import { Link2, MapPin, Server } from 'lucide-react';

export default function HttpRequestSimulatorPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <HTTPRequestSimulator />

      <ToolInfoSection
        features={[
          'Support for GET, POST, PUT, DELETE, PATCH methods',
          'Custom request headers configuration',
          'JSON/Form body editor with validation',
          'Response preview with syntax highlighting',
          'Request history and replay',
          'CORS proxy support for cross-origin requests',
        ]}
        info={{
          category: 'Network Tools',
          processing: 'Hybrid',
          security: 'API Proxy',
          difficulty: 'Intermediate',
        }}
        related={[
          {
            name: 'DNS Lookup',
            description: 'Perform DNS lookups for A, AAAA, MX, TXT records',
            href: '/tools/network/dns-lookup',
            icon: <Server className="h-5 w-5" />,
          },
          {
            name: 'IP Geolocation',
            description: 'Get geographic information about IP addresses',
            href: '/tools/network/ip-geolocation',
            icon: <MapPin className="h-5 w-5" />,
          },
          {
            name: 'URL Shortener',
            description: 'Create short URLs and manage link redirects',
            href: '/tools/network/url-shortener',
            icon: <Link2 className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
}

export const metadata = {
  title: 'HTTP Request Simulator - Parsify',
  description: 'Simulate and test HTTP requests with various methods and headers',
};
