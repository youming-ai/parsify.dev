import { JsonToTypes } from '@/components/tools/json/json-to-types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON to Types | Parsify',
  description: 'Convert JSON payloads into typed models for TypeScript, Python, Go, and Java.',
};

export default function JsonToTypesPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <JsonToTypes />
    </div>
  );
}
