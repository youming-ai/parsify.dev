import { Shield } from "lucide-react";
import type { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TextCounterClient from "./client";

export const metadata: Metadata = {
  title: "Text Character Counter - Count Words, Characters & Lines",
  description:
    "Advanced text analyzer with character, word, line counting, reading time calculation and more.",
  keywords: [
    "text counter",
    "character count",
    "word count",
    "line count",
    "reading time",
    "text analysis",
  ],
};

export default function TextCounterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Text Character Counter</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Comprehensive text analysis with real-time statistics
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary">Real-Time</Badge>
            <Badge variant="outline">Detailed</Badge>
            <Badge variant="default">Accurate</Badge>
          </div>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> Text analysis is performed entirely in your browser.
            Your text never leaves your device.
          </AlertDescription>
        </Alert>

        <TextCounterClient />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Counting Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Character count (with/without spaces)</li>
                <li>• Word count with intelligent detection</li>
                <li>• Line count and paragraph analysis</li>
                <li>• Sentence counting</li>
                <li>• Reading time estimation</li>
                <li>• Character frequency analysis</li>
                <li>• Word length distribution</li>
                <li>• Unicode character support</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Average word length</li>
                <li>• Average sentence length</li>
                <li>• Lexical density calculation</li>
                <li>• Readability scores</li>
                <li>• Most frequent words</li>
                <li>• Character usage patterns</li>
                <li>• Text complexity analysis</li>
                <li>• Export detailed reports</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
