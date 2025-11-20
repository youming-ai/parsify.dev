import { Hash } from "lucide-react";
import type { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UUIDGeneratorClient from "./client";

export const metadata: Metadata = {
  title: "UUID Generator - Generate Unique Identifiers",
  description:
    "Generate various types of UUIDs instantly. Support for UUID v1, v4, and other formats.",
  keywords: ["UUID", "GUID", "generator", "unique identifier", "random", "v1", "v4"],
};

export default function UUIDGeneratorPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">UUID Generator</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Generate unique identifiers instantly
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary">Client-Side</Badge>
            <Badge variant="outline">Secure</Badge>
            <Badge variant="default">Instant</Badge>
          </div>
        </div>

        <Alert className="mb-6">
          <Hash className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> UUID generation is performed entirely in your browser.
            No data is sent to any server.
          </AlertDescription>
        </Alert>

        <UUIDGeneratorClient />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>UUID Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold">UUID v1</h4>
                  <p className="text-muted-foreground">Time-based + MAC address</p>
                </div>
                <div>
                  <h4 className="font-semibold">UUID v4</h4>
                  <p className="text-muted-foreground">Random or pseudo-random numbers</p>
                </div>
                <div>
                  <h4 className="font-semibold">GUID</h4>
                  <p className="text-muted-foreground">Microsoft variant of UUID</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Use Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Database primary keys</li>
                <li>• Transaction identifiers</li>
                <li>• Session tokens</li>
                <li>• File names</li>
                <li>• API request tracking</li>
                <li>• Distributed system coordination</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
