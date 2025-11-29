import { FileGenerator } from '@/components/tools/file/file-generator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'File Generator | Parsify',
  description: 'Generate sample files with custom size and content.',
};

export default function FileGeneratorPage() {
  return (
    <div className="container mx-auto py-8">
      <FileGenerator />
    </div>
  );
}
