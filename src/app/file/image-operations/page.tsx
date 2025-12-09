import ToolWrapper from '@/components/shared/ToolWrapper';
import { ImageResizer } from '@/components/tools/image/image-resizer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Image Resizer & Cropper - Resize, Crop, Rotate Images Online',
  description:
    'Free online image resizer and cropper. Resize, crop, and rotate images with aspect ratio control. Supports batch editing and all major image formats.',
  keywords: [
    'image resizer',
    'image cropper',
    'resize image online',
    'crop image',
    'rotate image',
    'image editor',
    'aspect ratio',
  ],
  openGraph: {
    title: 'Image Resizer & Cropper - Parsify.dev',
    description: 'Resize, crop, and rotate images online with aspect ratio control.',
  },
};

export default function ImageResizerPage() {
  return (
    <ToolWrapper
      title="Image Resizer"
      description="Resize images with custom dimensions and maintain aspect ratio"
    >
      <ImageResizer />
    </ToolWrapper>
  );
}
