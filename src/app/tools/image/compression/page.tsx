import { ToolInfoSection } from '@/components/tools/tool-info-section';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Image as ImageIcon, Maximize, Shield } from 'lucide-react';
import type { Metadata } from 'next';
import ImageCompressionClient from './client';

export const metadata: Metadata = {
  title: 'Image Compression - Compress Images Online',
  description:
    'Compress images online with quality adjustment. Support for JPEG, PNG, WebP formats with instant preview.',
  keywords: ['image compression', 'resize', 'optimize', 'JPEG', 'PNG', 'WebP', 'image optimizer'],
};

export default function ImageCompressionPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy Notice:</strong> Image compression is performed entirely in your browser.
          Your images never leave your device.
        </AlertDescription>
      </Alert>

      <ImageCompressionClient />

      <ToolInfoSection
        features={[
          'Quality adjustment slider (0-100%)',
          'Multiple format support (JPEG, PNG, WebP)',
          'Real-time compression preview',
          'Batch compression for multiple images',
          'Before/after comparison view',
          'Size reduction percentage calculation',
        ]}
        info={{
          category: 'Image Tools',
          processing: 'Client Side',
          security: 'Local Only',
          difficulty: 'Beginner',
        }}
        related={[
          {
            name: 'Image Converter',
            description: 'Convert images between different formats',
            href: '/tools/image/converter',
            icon: <ImageIcon className="h-5 w-5" />,
          },
          {
            name: 'Image Resizer',
            description: 'Resize images with custom dimensions',
            href: '/tools/image/resizer',
            icon: <Maximize className="h-5 w-5" />,
          },
          {
            name: 'Base64 Image Converter',
            description: 'Convert images to Base64 strings',
            href: '/tools/image/base64',
            icon: <ImageIcon className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
}
