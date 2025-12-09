import ToolWrapper from '@/components/shared/ToolWrapper';
import { ImageConverter } from '@/components/tools/image/image-converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Image Converter - Convert PNG, JPG, WebP, GIF Online',
  description:
    'Free online image converter. Convert images between PNG, JPG, WebP, GIF, TIFF, and SVG formats with batch conversion support. Privacy-focused, runs in your browser.',
  keywords: [
    'image converter',
    'png to jpg',
    'jpg to webp',
    'gif converter',
    'webp converter',
    'image format',
    'batch convert images',
  ],
  openGraph: {
    title: 'Image Converter - Parsify.dev',
    description: 'Convert images between PNG, JPG, WebP, GIF, and other formats instantly.',
  },
};

export default function ImageConverterPage() {
  return (
    <ToolWrapper
      title="Image Format Converter"
      description="Convert images between different formats (JPG, PNG, WebP, GIF, etc.)"
    >
      <ImageConverter />
    </ToolWrapper>
  );
}
