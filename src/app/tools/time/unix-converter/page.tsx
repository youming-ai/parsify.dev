import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Shield, Calendar, Globe } from "lucide-react";
import TimestampConverterClient from "./client";

export const metadata: Metadata = {
  title: "Unix Timestamp Converter - Convert Timestamps Instantly",
  description:
    "Convert Unix timestamps to human-readable dates and vice versa. Support for milliseconds and multiple timezones.",
  keywords: [
    "Unix timestamp",
    "epoch time",
    "date converter",
    "time converter",
    "timezone",
    "milliseconds",
  ],
};

export default function UnixConverterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Unix Timestamp Converter</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Convert between Unix timestamps and human-readable dates instantly
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary">Real-Time</Badge>
            <Badge variant="outline">Multiple Timezones</Badge>
            <Badge variant="default">Accurate</Badge>
          </div>
        </div>

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
              <ul className="space-y-2 text-sm text-muted-foreground">
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
              <ul className="space-y-2 text-sm text-muted-foreground">
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
