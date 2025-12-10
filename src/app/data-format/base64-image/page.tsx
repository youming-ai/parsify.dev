import Base64ImageConverter from '@/components/tools/image/base64-image-converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Base64 Image Converter - Encode & Decode Images Online',
  description:
    'Free online Base64 image converter. Encode images to Base64 data URIs and decode Base64 strings back to images with live preview. Supports PNG, JPG, GIF, WebP.',
  keywords: [
    'base64 image',
    'image to base64',
    'base64 to image',
    'data uri',
    'image encoder',
    'base64 converter',
    'embed images',
  ],
  openGraph: {
    title: 'Base64 Image Converter - Parsify.dev',
    description: 'Convert images to Base64 and vice versa with instant preview.',
  },
};

import { Image } from 'lucide-react';
import { PixelToolHeader } from '@/components/tools/shared/pixel-tool-header';
// ... existing imports

export default function Base64ImagePage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <PixelToolHeader
        title="BASE64 IMAGE"
        description="Convert images to Base64 and vice versa with instant preview. Support PNG, JPG, GIF, WebP. Privacy compliant."
        category="Data Format"
        icon={<Image className="h-8 w-8" />}
      />

      <div className="border-2 border-foreground/20 p-1 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] bg-card rounded-none">
        <Base64ImageConverter />
      </div>
    </div>
  );
}
