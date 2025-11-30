import { ToolPageLayout } from '@/components/layout/tool-page-layout';
import { JsonToolComplete } from '@/components/tools/json/json-tool-complete';
import { FileJson } from 'lucide-react';

export default function JsonFormatterPage() {
  return (
    <ToolPageLayout
      title="JSON Formatter"
      description="Format, beautify, and validate JSON data with customizable indentation and sorting options"
      icon={<FileJson className="h-8 w-8" />}
      features={[
        'Format & Beautify JSON with one click',
        'Real-time syntax validation',
        'Customizable indentation (2/4 spaces, tabs)',
        'Alphabetical key sorting',
        'Intelligent error detection with line numbers',
      ]}
      info={{
        category: 'JSON Processing',
        processing: 'Client Side',
        security: 'Local Only',
        difficulty: 'Beginner',
      }}
      related={[
        {
          name: 'JSON Validator',
          description: 'Comprehensive JSON validation with detailed error messages',
          href: '/tools/json/validator',
          icon: <FileJson className="h-5 w-5" />,
        },
        {
          name: 'JSON Converter',
          description: 'Convert JSON to various formats like XML, CSV, YAML',
          href: '/tools/json/converter',
          icon: <FileJson className="h-5 w-5" />,
        },
        {
          name: 'JSON Path Evaluator',
          description: 'Extract data from JSON using JSONPath expressions',
          href: '/tools/json/path-queries',
          icon: <FileJson className="h-5 w-5" />,
        },
      ]}
    >
      <JsonToolComplete showHeader={false} />
    </ToolPageLayout>
  );
}
