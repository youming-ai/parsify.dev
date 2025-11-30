import { ToolPageLayout } from '@/components/layout/tool-page-layout';
import { JsonConverter } from '@/components/tools/json/json-converter';
import { FileJson, RefreshCw } from 'lucide-react';

export default function JsonConverterPage() {
  return (
    <ToolPageLayout
      title="JSON Converter"
      description="Convert JSON to various formats like XML, CSV, YAML, and vice versa"
      icon={<FileJson className="h-8 w-8" />}
      features={[
        'Convert to XML, CSV, YAML, and TOML formats',
        'Bidirectional conversion support',
        'Batch conversion for multiple files',
        'Custom field mapping options',
        'Live preview before download',
      ]}
      info={{
        category: 'JSON Processing',
        processing: 'Hybrid',
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
          name: 'JSON to Types',
          description: 'Generate TypeScript/Python types from JSON',
          href: '/tools/json/to-types',
          icon: <RefreshCw className="h-5 w-5" />,
        },
      ]}
    >
      <JsonConverter />
    </ToolPageLayout>
  );
}
