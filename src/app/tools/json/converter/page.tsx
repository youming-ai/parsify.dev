import { ToolPageLayout } from '@/components/layout/tool-page-layout';
import { JsonToolComplete } from '@/components/tools/json/json-tool-complete';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileJson } from 'lucide-react';
import Link from 'next/link';

export default function JsonConverterPage() {
  const badges = (
    <>
      <Badge variant="outline">Intermediate</Badge>
      <Badge variant="default">Stable</Badge>
      <Badge variant="secondary">New</Badge>
    </>
  );

  const features = (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Features</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
            <span className="text-gray-700 dark:text-gray-300">Multiple Formats</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
            <span className="text-gray-700 dark:text-gray-300">Batch Conversion</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
            <span className="text-gray-700 dark:text-gray-300">Custom Mapping</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
            <span className="text-gray-700 dark:text-gray-300">Preview Mode</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );

  const info = (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="font-medium text-gray-900 dark:text-white">Category:</span>{' '}
          <span className="text-gray-600 dark:text-gray-400">JSON Processing</span>
        </div>
        <div>
          <span className="font-medium text-gray-900 dark:text-white">Processing:</span>{' '}
          <span className="text-gray-600 dark:text-gray-400">Hybrid</span>
        </div>
        <div>
          <span className="font-medium text-gray-900 dark:text-white">Security:</span>{' '}
          <span className="text-gray-600 dark:text-gray-400">Local Only</span>
        </div>
      </CardContent>
    </Card>
  );

  const related = (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Related Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Link
            href="/tools/json/formatter"
            className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
          >
            <div className="flex items-center gap-3">
              <FileJson className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">JSON Formatter</h4>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  Format and beautify JSON data with customizable options
                </p>
              </div>
            </div>
          </Link>
          <Link
            href="/tools/json/validator"
            className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
          >
            <div className="flex items-center gap-3">
              <FileJson className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">JSON Validator</h4>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  Comprehensive JSON validation with detailed error messages
                </p>
              </div>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ToolPageLayout
      title="JSON Converter"
      description="Convert JSON to various formats like XML, CSV, YAML, and vice versa"
      icon={<FileJson className="h-8 w-8" />}
      badges={badges}
      features={features}
      info={info}
      related={related}
    >
      <JsonToolComplete />
    </ToolPageLayout>
  );
}
