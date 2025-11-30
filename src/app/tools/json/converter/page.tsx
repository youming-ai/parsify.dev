'use client';

import { ToolPageLayout } from '@/components/layout/tool-page-layout';
import { JsonConverter } from '@/components/tools/json/json-converter';
import { JsonSimpleEditor } from '@/components/tools/json/json-simple-editor';
import { FileJson, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function JsonConverterPage() {
  const [input, setInput] = useState('');

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
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Input JSON</h3>
          <JsonSimpleEditor
            value={input}
            onChange={setInput}
            height={300}
            placeholder="Paste your JSON here..."
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Conversion Settings</h3>
          <JsonConverter
            input={input}
            options={{
              targetFormat: 'xml',
              flatten: false,
            }}
            onConvert={() => { }}
            onError={(error) => toast.error(error)}
          />
        </div>
      </div>
    </ToolPageLayout>
  );
}
