import { Shield } from "lucide-react";
import type { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PythonConverterClient from "./client";

export const metadata: Metadata = {
  title: "JSON to Python Converter - Generate Python Classes from JSON",
  description:
    "Convert JSON to Python classes instantly. Generate dataclasses, Pydantic models, and standard Python classes from JSON.",
  keywords: ["JSON", "Python", "converter", "dataclass", "pydantic", "serialization", "generator"],
};

export default function PythonConverterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">JSON to Python Converter</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Generate Python classes from JSON data instantly
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary">Client-Side</Badge>
            <Badge variant="outline">Dataclasses</Badge>
            <Badge variant="default">Pydantic Support</Badge>
          </div>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> JSON conversion is performed entirely in your browser.
            Your data never leaves your device.
          </AlertDescription>
        </Alert>

        <PythonConverterClient />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Generated Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Python dataclass support</li>
                <li>• Pydantic model generation</li>
                <li>• Type hints and annotations</li>
                <li>• Nested class handling</li>
                <li>• Optional and Union types</li>
                <li>• List and Dict mappings</li>
                <li>• Default values support</li>
                <li>• Import statements generation</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Type Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• string → str</li>
                <li>• number → int | float</li>
                <li>• boolean → bool</li>
                <li>• array → List[Type]</li>
                <li>• object → Custom Class</li>
                <li>• null → None | Optional[Type]</li>
                <li>• Mixed types → Union[types]</li>
                <li>• Date/Time handling</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
