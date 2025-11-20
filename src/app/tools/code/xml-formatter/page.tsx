import { Shield } from "lucide-react";
import type { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import XMLFormatterClient from "./client";

export const metadata: Metadata = {
  title: "XML Formatter - Format & Beautify XML Code",
  description:
    "Format, beautify, and minify XML code instantly. Advanced XML formatting with validation and syntax highlighting.",
  keywords: [
    "XML",
    "formatter",
    "beautifier",
    "minifier",
    "pretty-print",
    "code formatting",
    "markup",
  ],
};

export default function XMLFormatterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">XML Formatter</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Format and beautify XML with intelligent indentation and validation
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary">Client-Side</Badge>
            <Badge variant="outline">Validation</Badge>
            <Badge variant="default">Pretty Print</Badge>
          </div>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> XML formatting is performed entirely in your browser.
            Your data never leaves your device.
          </AlertDescription>
        </Alert>

        <XMLFormatterClient />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Formatting Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Intelligent element indentation</li>
                <li>• Attribute alignment and formatting</li>
                <li>• Mixed content handling</li>
                <li>• CDATA section preservation</li>
                <li>• Comment preservation</li>
                <li>• DOCTYPE handling</li>
                <li>• Namespace awareness</li>
                <li>• XML declaration management</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validation Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Well-formedness checking</li>
                <li>• Tag matching validation</li>
                <li>• Attribute syntax checking</li>
                <li>• Entity reference validation</li>
                <li>• Character encoding detection</li>
                <li>• Error location highlighting</li>
                <li>• Syntax error reporting</li>
                <li>• Structure validation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
