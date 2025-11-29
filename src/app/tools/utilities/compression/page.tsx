import { CompressionTool } from '@/components/tools/utilities/compression-tool';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compression Tools | Parsify',
  description: 'Compress and decompress text with gzip/deflate directly in your browser.',
};

export default function CompressionPage() {
  return (
    <div className="container mx-auto py-8">
      <CompressionTool />
    </div>
  );
}
