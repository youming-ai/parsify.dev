import { ToolInfoSection } from '@/components/tools/tool-info-section';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link2, QrCode, ScanLine } from 'lucide-react';
import type { Metadata } from 'next';
import QRGeneratorClient from './client';

export const metadata: Metadata = {
  title: 'QR Code Generator - Create Custom QR Codes',
  description:
    'Generate QR codes instantly for URLs, text, WiFi, contact info and more. Customizable size and error correction.',
  keywords: ['QR code', 'generator', 'quick response', 'mobile', 'scanner', 'barcode', 'URL'],
};

export default function QRGeneratorPage() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <Alert className="mb-6">
        <QrCode className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy Notice:</strong> QR code generation is performed entirely in your browser.
          Your data never leaves your device.
        </AlertDescription>
      </Alert>

      <QRGeneratorClient />

      <ToolInfoSection
        features={[
          'Generate QR codes for URLs, text, WiFi, vCard',
          'Customizable size (100-500px)',
          'Multiple error correction levels',
          'Download as PNG or SVG format',
          'Color customization options',
          'Logo/image overlay support',
        ]}
        info={{
          category: 'Utilities',
          processing: 'Client Side',
          security: 'Local Only',
          difficulty: 'Beginner',
        }}
        related={[
          {
            name: 'QR Code Reader',
            description: 'Scan and decode QR codes from images',
            href: '/tools/image/qr-reader',
            icon: <ScanLine className="h-5 w-5" />,
          },
          {
            name: 'URL Encoder',
            description: 'Encode and decode URLs and URI components',
            href: '/tools/utilities/url-encoder',
            icon: <Link2 className="h-5 w-5" />,
          },
          {
            name: 'Base64 Converter',
            description: 'Encode and decode Base64 strings',
            href: '/tools/utilities/base64-converter',
            icon: <QrCode className="h-5 w-5" />,
          },
        ]}
      />
    </div>
  );
}
