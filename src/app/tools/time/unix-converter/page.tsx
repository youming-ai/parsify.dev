import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import type { Metadata } from 'next';
import TimestampConverterClient from './client';

export const metadata: Metadata = {
  title: 'Unix Timestamp Converter - Convert Timestamps Instantly',
  description:
    'Convert Unix timestamps to human-readable dates and vice versa. Support for milliseconds and multiple timezones.',
  keywords: [
    'Unix timestamp',
    'epoch time',
    'date converter',
    'time converter',
    'timezone',
    'milliseconds',
  ],
};

export default function UnixConverterPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> Timestamp conversion is performed entirely in your
            browser. Your data never leaves your device.
          </AlertDescription>
        </Alert>

        <TimestampConverterClient />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Supported Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Unix timestamps (seconds since epoch)</li>
                <li>• Millisecond timestamps</li>
                <li>• ISO 8601 date strings</li>
                <li>• Human-readable dates</li>
                <li>• Current time conversion</li>
                <li>• Batch timestamp processing</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Multiple timezone support</li>
                <li>• Real-time current timestamp</li>
                <li>• Date format customization</li>
                <li>• Timestamp validation</li>
                <li>• Relative time calculations</li>
                <li>• Copy to clipboard functionality</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
