import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code, Shield, Download, Zap } from "lucide-react";
import JavaConverterClient from "./client";

export const metadata: Metadata = {
  title: "JSON to Java Class Converter - Generate POJOs from JSON",
  description:
    "Convert JSON to Java classes instantly. Generate POJOs, getters, setters, and constructors from JSON data.",
  keywords: ["JSON", "Java", "converter", "POJO", "class generator", "serialization", "Jackson"],
};

export default function JavaConverterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">JSON to Java Converter</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Generate Java classes from JSON data instantly
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary">Client-Side</Badge>
            <Badge variant="outline">POJO Generator</Badge>
            <Badge variant="default">Instant</Badge>
          </div>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> JSON conversion is performed entirely in your browser.
            Your data never leaves your device.
          </AlertDescription>
        </Alert>

        <JavaConverterClient />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Generated Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Proper Java class structure</li>
                <li>• Getters and setters methods</li>
                <li>• Default constructors</li>
                <li>• toString() method</li>
                <li>• equals() and hashCode() methods</li>
                <li>• Jackson annotations support</li>
                <li>• Proper data type mapping</li>
                <li>• Nested object handling</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Type Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• string → String</li>
                <li>• number → Integer/Double</li>
                <li>• boolean → Boolean</li>
                <li>• array → List&lt;Type&gt;</li>
                <li>• object → Custom Class</li>
                <li>• null → Object</li>
                <li>• Date handling support</li>
                <li>• Generic type detection</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
