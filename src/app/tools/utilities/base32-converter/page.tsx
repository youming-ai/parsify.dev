import { Shield } from "lucide-react";
import type { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Base32Client from "./client";

export const metadata: Metadata = {
  title: "Base32 Converter - Encode & Decode Base32",
  description:
    "Encode and decode Base32 strings instantly. Support for RFC 4648 Base32 and custom alphabets.",
  keywords: ["Base32", "encoder", "decoder", "base64", "encoding", "decoding", "RFC 4648"],
};

export default function Base32ConverterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Base32 Converter</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Encode and decode Base32 strings with RFC 4648 compliance
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary">Client-Side</Badge>
            <Badge variant="outline">RFC 4648</Badge>
            <Badge variant="default">Secure</Badge>
          </div>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> Base32 conversion is performed entirely in your
            browser. Your data never leaves your device.
          </AlertDescription>
        </Alert>

        <Base32Client />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Base32 Encoding</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• RFC 4648 compliant implementation</li>
                <li>• UTF-8 character support</li>
                <li>• Automatic padding handling</li>
                <li>• Binary to Base32 conversion</li>
                <li>• Case-insensitive decoding</li>
                <li>• Error detection and reporting</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Use Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Data encoding for URLs and filenames</li>
                <li>• License key generation</li>
                <li>• Short URL services</li>
                <li>• Data integrity verification</li>
                <li>• Cryptographic applications</li>
                <li>• Legacy system compatibility</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
