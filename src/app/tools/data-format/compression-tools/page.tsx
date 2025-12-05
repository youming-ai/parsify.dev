import { CompressionTool } from '@/components/tools/utilities/compression-tool';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compression Tools | Parsify',
  description: 'Compress and decompress text with gzip/deflate directly in your browser.',
};

export default function CompressionPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <CompressionTool />
    </div>
  );
}
