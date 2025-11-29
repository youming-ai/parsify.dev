import Base64ImageConverter from '@/components/tools/image/base64-image-converter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Base64 Image Converter | Parsify',
  description:
    'Convert images to Base64 strings and decode Base64 back to images with live preview.',
};

export default function Base64ImagePage() {
  return (
    <div className="container mx-auto py-8">
      <Base64ImageConverter />
    </div>
  );
}
