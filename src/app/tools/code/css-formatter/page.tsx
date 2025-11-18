import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code2, Zap, Shield, Download } from "lucide-react";
import CSSFormatterClient from "./client";

export const metadata: Metadata = {
  title: "CSS Formatter - Format, Minify & Beautify CSS",
  description:
    "Format, minify, and beautify CSS code instantly. Advanced CSS code formatter with customizable options.",
  keywords: ["CSS", "formatter", "beautifier", "minifier", "pretty-print", "code formatting"],
};

export default function CSSFormatterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">CSS Formatter</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Format, minify, and beautify CSS code instantly
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary">Client-Side</Badge>
            <Badge variant="outline">Fast</Badge>
            <Badge variant="default">Secure</Badge>
          </div>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> CSS formatting is performed entirely in your browser.
            Your code never leaves your device.
          </AlertDescription>
        </Alert>

        <CSSFormatterClient />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Formatting Options</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Indentation size control</li>
                <li>• Bracket placement options</li>
                <li>• Property sorting</li>
                <li>• Color format conversion</li>
                <li>• Shorthand optimization</li>
                <li>• Comment preservation</li>
                <li>• Media query formatting</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Minification Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Remove unnecessary whitespace</li>
                <li>• Optimize property values</li>
                <li>• Merge duplicate selectors</li>
                <li>• Remove redundant units</li>
                <li>• Compress color values</li>
                <li>• Optimize font weights</li>
                <li>• Remove empty rules</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
