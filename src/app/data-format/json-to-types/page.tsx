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

export default function JsonToTypesPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <JsonToTypes />
    </div>
  );
}
