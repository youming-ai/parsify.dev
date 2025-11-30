'use client';

import { JsonPathQueries } from '@/components/tools/json/jsonpath-queries';
import { ToolInfoSection } from '@/components/tools/tool-info-section';
import { FileJson } from 'lucide-react';

export default function JsonPathQueriesPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      {/* Tool Component */}
      <JsonPathQueries />

      {/* Tool Info Section */}
      <ToolInfoSection
        features={[
          'Powerful JSONPath expressions for querying JSON data',
          'Real-time results as you type your query',
          'Syntax highlighting for better readability',
          'Query history to quickly reuse previous queries',
          'Support for complex nested path navigation',
        ]}
        info={{
          category: 'JSON Processing',
          processing: 'Client Side',
          security: 'Local Only',
          difficulty: 'Intermediate',
        }}
        related={[
          {
            name: 'JSON Formatter',
            description: 'Format and beautify JSON data with customizable options',
            href: '/tools/json/formatter',
            icon: <FileJson className="h-5 w-5" />,
          },
          {
            name: 'JSON Validator',
            description: 'Comprehensive JSON validation with detailed error messages',
            href: '/tools/json/validator',
            icon: <FileJson className="h-5 w-5" />,
          },
          {
            name: 'JSON Hero Viewer',
            description: 'Explore JSON data with tree view and navigation',
            href: '/tools/json/hero-viewer',
            icon: <FileJson className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
}
