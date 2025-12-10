/**
 * Image Processing Tools Index
 * Lazy-loaded exports for image processing tools
 */

export { QRCodeReader } from './qr-code-reader';

// Tool metadata for registry
export const imageToolsMetadata = [
  {
    id: 'qr-code-reader',
    name: 'QR Code Reader',
    description: 'Scan QR codes from images or camera with intelligent content detection',
    category: 'image' as const,
    version: '1.0.0',
    bundleSize: 65000,
    loadTime: 0,
    dependencies: ['@/lib/image/qr-scanner', 'qr-scanner'],
    tags: ['qr', 'scanner', 'camera', 'barcode', 'decode'],
    enabled: true,
    priority: 2,
    icon: 'qrcode',
    author: 'Parsify Team',
    license: 'MIT',
  },
];
