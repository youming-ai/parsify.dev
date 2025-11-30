'use client';

import { CodeToolComplete } from '@/components/tools/code/code-tool-complete';
import { ToolInfoSection } from '@/components/tools/tool-info-section';
import { Code, Play, Terminal } from 'lucide-react';

export default function CodeFormatterPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      {/* Tool Component */}
      <CodeToolComplete />

      {/* Tool Info Section */}
      <ToolInfoSection
        features={[
          'Support for JavaScript, TypeScript, HTML, CSS, and more',
          'Prettier integration for consistent formatting',
          'Customizable formatting rules and presets',
          'Batch formatting for multiple files',
          'Minification and compression options',
        ]}
        info={{
          category: 'Code Tools',
          processing: 'Client Side',
          security: 'Local Only',
          difficulty: 'Beginner',
        }}
        related={[
          {
            name: 'Code Executor',
            description: 'Execute code in a secure WASM sandbox with multiple language support',
            href: '/tools/code/executor',
            icon: <Play className="h-5 w-5" />,
          },
          {
            name: 'HTML Tools',
            description: 'Format, minify, validate, and encode HTML markup',
            href: '/tools/code/html-tools',
            icon: <Code className="h-5 w-5" />,
          },
          {
            name: 'JSON Formatter',
            description: 'Format and beautify JSON data',
            href: '/tools/json/formatter',
            icon: <Terminal className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
}
