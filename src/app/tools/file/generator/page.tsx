import { FileGenerator } from '@/components/tools/file/file-generator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test File Generator - Create PDF, CSV, JSON, Image Files Online',
  description:
    'Free online test file generator. Create sample PDF, Word, CSV, JSON, PNG, JPG, SVG, and Excel files with customizable content and size for testing.',
  keywords: [
    'file generator',
    'test file',
    'dummy file',
    'sample pdf',
    'generate csv',
    'test data',
    'mock file',
  ],
  openGraph: {
    title: 'Test File Generator - Parsify.dev',
    description: 'Generate test files in PDF, CSV, JSON, and image formats instantly.',
  },
};

export default function FileGeneratorPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <FileGenerator />
    </div>
  );
}
