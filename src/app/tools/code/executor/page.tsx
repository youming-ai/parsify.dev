'use client';

import { CodeToolComplete } from '@/components/tools/code/code-tool-complete';
import { ToolInfoSection } from '@/components/tools/tool-info-section';
import { Code, Terminal } from 'lucide-react';

export default function CodeExecutorPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      {/* Tool Component */}
      <CodeToolComplete />

      {/* Tool Info Section */}
      <ToolInfoSection
        features={[
          'Support for JavaScript, TypeScript, Python and more',
          'Secure WASM-based sandboxing for safe execution',
          'Real-time output display as code runs',
          'Debug mode with step-by-step execution',
          'Code snippets and templates library',
        ]}
        info={{
          category: 'Code Execution',
          processing: 'Client Side',
          security: 'Secure Sandbox',
          difficulty: 'Intermediate',
        }}
        related={[
          {
            name: 'Code Formatter',
            description: 'Format and beautify code in multiple programming languages',
            href: '/tools/code/formatter',
            icon: <Terminal className="h-5 w-5" />,
          },
          {
            name: 'HTML Viewer',
            description: 'Preview and test HTML snippets with live rendering',
            href: '/tools/code/html-viewer',
            icon: <Code className="h-5 w-5" />,
          },
          {
            name: 'JSON Formatter',
            description: 'Format and validate JSON output from your code',
            href: '/tools/json/formatter',
            icon: <Code className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
}
