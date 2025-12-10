import { JsonToTypes } from '@/components/tools/json/json-to-types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON to Types - Convert JSON to TypeScript, Python, Go',
  description:
    'Free online JSON to type converter. Generate TypeScript interfaces, Python dataclasses, Go structs, Rust structs, and Ruby classes from JSON data.',
  keywords: [
    'json to typescript',
    'json to python',
    'json to go',
    'json to rust',
    'json to types',
    'json schema',
    'type generator',
  ],
  openGraph: {
    title: 'JSON to Types - Parsify.dev',
    description: 'Convert JSON to TypeScript, Python, Go, Rust, and Ruby types.',
  },
};

import { FileCode } from 'lucide-react';
import { PixelToolHeader } from '@/components/tools/shared/pixel-tool-header';
// ... existing imports

export default function JsonToTypesPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <PixelToolHeader
        title="TYPE GENERATOR"
        description="Convert JSON to multiple languages: TypeScript, Python, Go, Rust. Auto-detects types and structures."
        category="Data Format"
        icon={<FileCode className="h-8 w-8" />}
      />

      <div className="border-2 border-foreground/20 p-1 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] bg-card rounded-none">
        <JsonToTypes />
      </div>
    </div>
  );
}
