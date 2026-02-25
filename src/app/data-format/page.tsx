import { JsonLd } from '@/components/seo/json-ld';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { SEO_CONFIG } from '@/lib/seo-config';
import { generateStructuredData } from '@/lib/structured-data';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Data Format Workbench - Parse, Validate, Convert JSON/TOML/Base64',
  description:
    'Unified data workbench for parsing, validating, and converting JSON, TOML, text, and Base64 with privacy-first client-side processing.',
  alternates: {
    canonical: '/data-format',
  },
};

const DataWorkbench = dynamic(() => import('@/components/tools/workbench/data-workbench'), {
  loading: () => <ToolLoading message="Loading Data Workbench..." />,
});

export default function DataFormatWorkbenchPage() {
  const pageStructuredData = generateStructuredData({
    type: 'WebPage',
    name: 'Parsify Data Format Workbench',
    description:
      'Unified data workbench for parsing, validating, and converting JSON, TOML, text, and Base64.',
    url: `${SEO_CONFIG.BASE_URL}/data-format`,
    breadcrumb: [
      { name: 'Home', url: SEO_CONFIG.BASE_URL },
      { name: 'Data Format Workbench', url: `${SEO_CONFIG.BASE_URL}/data-format` },
    ],
  });

  return (
    <>
      <JsonLd data={pageStructuredData} />
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="Parsing, validation, and conversion run locally in your browser. AI Assist sends selected content to Groq for processing." />
        <DataWorkbench />
      </div>
    </>
  );
}
