import { Shield } from "lucide-react";
import type { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageCompressionClient from "./client";

export const metadata: Metadata = {
  title: "Image Compression - Compress Images Online",
  description:
    "Compress images online with quality adjustment. Support for JPEG, PNG, WebP formats with instant preview.",
  keywords: ["image compression", "resize", "optimize", "JPEG", "PNG", "WebP", "image optimizer"],
};

export default function ImageCompressionPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Image Compression</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Compress and optimize images instantly with quality control
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary">Client-Side</Badge>
            <Badge variant="outline">Privacy Protected</Badge>
            <Badge variant="default">Instant</Badge>
          </div>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> Image compression is performed entirely in your
            browser. Your images never leave your device.
          </AlertDescription>
        </Alert>

        <ImageCompressionClient />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Compression Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Quality adjustment (0-100%)</li>
                <li>• Multiple format support (JPEG, PNG, WebP)</li>
                <li>• Real-time preview</li>
                <li>• Batch compression</li>
                <li>• Size reduction calculation</li>
                <li>• Download compressed images</li>
                <li>• Before/after comparison</li>
                <li>• Metadata preservation options</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  • <strong>JPEG:</strong> Lossy compression, ideal for photos
                </li>
                <li>
                  • <strong>PNG:</strong> Lossless compression, ideal for graphics
                </li>
                <li>
                  • <strong>WebP:</strong> Modern format, excellent compression
                </li>
                <li>
                  • <strong>Input:</strong> JPEG, PNG, WebP, GIF, BMP
                </li>
                <li>
                  • <strong>Output:</strong> JPEG, PNG, WebP
                </li>
                <li>
                  • <strong>Max size:</strong> Up to 50MB per image
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
