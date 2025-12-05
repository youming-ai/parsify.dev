import { ToolPageLayout } from '@/components/layout/tool-page-layout';
import { JsonToolComplete } from '@/components/tools/json/json-tool-complete';
import { FileJson } from 'lucide-react';

export default function JsonFormatterPage() {
  return (
    <ToolPageLayout
      title="JSON Formatter"
      description="Format, beautify, and validate JSON data with customizable indentation and sorting options"
      icon={<FileJson className="h-8 w-8" />}
    >
      <JsonToolComplete showHeader={false} />
    </ToolPageLayout>
  );
}
