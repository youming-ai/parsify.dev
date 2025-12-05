import { CompressionTool } from '@/components/tools/utilities/compression-tool';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compression Tools - Gzip & Brotli Compress/Decompress Online',
  description:
    'Free online compression tool. Compress and decompress text with Gzip and Brotli algorithms. View compression stats and ratios instantly.',
  keywords: [
    'gzip compression',
    'brotli compression',
    'online compressor',
    'decompress online',
    'text compression',
    'file compression',
  ],
  openGraph: {
    title: 'Compression Tools - Parsify.dev',
    description: 'Compress and decompress text with Gzip and Brotli in your browser.',
  },
};

export default function CompressionPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <CompressionTool />
    </div>
  );
}
