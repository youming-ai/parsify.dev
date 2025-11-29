import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Smartphone } from 'lucide-react';
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
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto w-full">
        <Alert className="mb-6">
          <QrCode className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> QR code generation is performed entirely in your
            browser. Your data never leaves your device.
          </AlertDescription>
        </Alert>

        <QRGeneratorClient />

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                QR Code Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• URLs and websites</li>
                <li>• Plain text messages</li>
                <li>• WiFi credentials</li>
                <li>• Contact cards (vCard)</li>
                <li>• Email addresses</li>
                <li>• Phone numbers</li>
                <li>• GPS coordinates</li>
                <li>• Social media profiles</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customization Options</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Multiple sizes (100-500px)</li>
                <li>• Error correction levels</li>
                <li>• Download formats (PNG, SVG)</li>
                <li>• Color customization</li>
                <li>• Logo placement support</li>
                <li>• Batch generation</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Use Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Business cards</li>
                <li>• WiFi sharing</li>
                <li>• Event check-ins</li>
                <li>• Product packaging</li>
                <li>• Restaurant menus</li>
                <li>• Payment processing</li>
                <li>• App downloads</li>
                <li>• Contact information</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
