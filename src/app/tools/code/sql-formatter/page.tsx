import { Shield } from "lucide-react";
import type { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SQLFormatterClient from "./client";

export const metadata: Metadata = {
  title: "SQL Formatter - Format & Beautify SQL Code",
  description:
    "Format, beautify, and minify SQL code instantly. Support for multiple SQL dialects with customizable formatting options.",
  keywords: [
    "SQL",
    "formatter",
    "beautifier",
    "minifier",
    "pretty-print",
    "code formatting",
    "database",
  ],
};

export default function SQLFormatterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">SQL Formatter</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Format and beautify SQL code with intelligent formatting
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary">Client-Side</Badge>
            <Badge variant="outline">Multi-Dialect</Badge>
            <Badge variant="default">Intelligent</Badge>
          </div>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> SQL formatting is performed entirely in your browser.
            Your queries never leave your device.
          </AlertDescription>
        </Alert>

        <SQLFormatterClient />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Supported SQL Dialects</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  • <strong>Standard SQL:</strong> ANSI SQL compliance
                </li>
                <li>
                  • <strong>MySQL:</strong> MySQL-specific syntax
                </li>
                <li>
                  • <strong>PostgreSQL:</strong> PostgreSQL features
                </li>
                <li>
                  • <strong>SQL Server:</strong> T-SQL syntax
                </li>
                <li>
                  • <strong>Oracle:</strong> PL/SQL support
                </li>
                <li>
                  • <strong>SQLite:</strong> SQLite syntax
                </li>
                <li>
                  • <strong>MariaDB:</strong> MariaDB extensions
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Formatting Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Intelligent keyword capitalization</li>
                <li>• Proper indentation and alignment</li>
                <li>• Consistent whitespace formatting</li>
                <li>• JOIN formatting and optimization</li>
                <li>• Subquery nesting and alignment</li>
                <li>• Comment preservation</li>
                <li>• Query minification for production</li>
                <li>• Syntax highlighting preview</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
