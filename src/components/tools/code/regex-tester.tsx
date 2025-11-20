"use client";

import { AlertTriangle, BookOpen, CheckCircle2, Copy, XCircle } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface TestResult {
  matches: boolean;
  groups: string[] | null;
  error?: string;
}

interface PatternExample {
  name: string;
  pattern: string;
  description: string;
  category: string;
}

const REGEX_EXAMPLES: PatternExample[] = [
  {
    name: "Email Validation",
    pattern: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$`,
    description: "Validates email addresses",
    category: "Validation",
  },
  {
    name: "Phone Number (US)",
    pattern: `^\\(?([0-9]{3})\\)?[-.\\s]?([0-9]{3})[-.\\s]?([0-9]{4})$`,
    description: "Validates US phone numbers",
    category: "Validation",
  },
  {
    name: "URL",
    pattern: `https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)`,
    description: "Validates URLs",
    category: "Validation",
  },
  {
    name: "Strong Password",
    pattern: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$`,
    description: "Requires at least 8 chars, 1 uppercase, 1 lowercase, 1 number",
    category: "Validation",
  },
  {
    name: "IPv4 Address",
    pattern: `^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$`,
    description: "Validates IPv4 addresses",
    category: "Network",
  },
  {
    name: "Hex Color Code",
    pattern: `^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$`,
    description: "Validates hex color codes",
    category: "Colors",
  },
  {
    name: "Date (YYYY-MM-DD)",
    pattern: `^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$`,
    description: "Validates dates in YYYY-MM-DD format",
    category: "Date",
  },
  {
    name: "Credit Card Number",
    pattern: `^\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}$`,
    description: "Basic credit card number format",
    category: "Validation",
  },
];

export function RegexTester() {
  const [pattern, setPattern] = React.useState("");
  const [flags, setFlags] = React.useState("g");
  const [testText, setTestText] = React.useState("");
  const [result, setResult] = React.useState<TestResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [_activeExample, setActiveExample] = React.useState<PatternExample | null>(null);

  const testRegex = React.useCallback(() => {
    if (!pattern) {
      setError("Please enter a regex pattern");
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const matches = regex.test(testText);
      const groups = testText.match(regex);

      setResult({
        matches,
        groups: groups ? Array.from(groups) : null,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid regex pattern");
      setResult(null);
    }
  }, [pattern, flags, testText]);

  const loadExample = (example: PatternExample) => {
    setPattern(example.pattern);
    setTestText("");
    setResult(null);
    setError(null);
    setActiveExample(example);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      console.log("Copied to clipboard");
    });
  };

  const _getFlagDescription = (flag: string) => {
    const descriptions: Record<string, string> = {
      g: "Global - Find all matches",
      i: "Case Insensitive",
      m: "Multiline - ^ and $ match line breaks",
      s: "Dot All - . matches newlines",
      u: "Unicode - Enable unicode features",
      y: "Sticky - Matches at position of lastIndex",
    };
    return descriptions[flag] || "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Regex Tester</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Test and debug regular expressions in real-time
          </p>
        </div>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">Regex Builder</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          {/* Pattern Input */}
          <Card>
            <CardHeader>
              <CardTitle>Regular Expression Pattern</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pattern">Pattern</Label>
                <div className="relative">
                  <Input
                    id="pattern"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="Enter regex pattern, e.g., ^\\d+$"
                    className="font-mono"
                  />
                  {pattern && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => copyToClipboard(pattern)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Flags */}
              <div className="space-y-2">
                <Label>Flags</Label>
                <div className="flex flex-wrap gap-2">
                  {["g", "i", "m", "s", "u", "y"].map((flag) => (
                    <div key={flag} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`flag-${flag}`}
                        checked={flags.includes(flag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFlags(flags + flag);
                          } else {
                            setFlags(flags.replace(flag, ""));
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`flag-${flag}`} className="text-sm font-mono">
                        {flag}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Text */}
          <Card>
            <CardHeader>
              <CardTitle>Test Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-text">Text to Test Against</Label>
                <Textarea
                  id="test-text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter text to test your regex against..."
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={testRegex} className="w-full">
                Test Pattern
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {(result || error) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result ? (
                    result.matches ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {result && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Match:</span>
                      <Badge variant={result.matches ? "default" : "secondary"}>
                        {result.matches ? "Yes" : "No"}
                      </Badge>
                    </div>

                    {result.groups && result.groups.length > 1 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Capture Groups:</span>
                        <div className="space-y-1">
                          {result.groups.slice(1).map((group, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded"
                            >
                              <span className="text-gray-500">Group {index + 1}:</span>
                              <span>{group || "(empty)"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REGEX_EXAMPLES.map((example) => (
              <Card key={example.name}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{example.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {example.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {example.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Pattern:</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(example.pattern)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <code className="block text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                      {example.pattern}
                    </code>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadExample(example)}
                      className="flex-1"
                    >
                      Load Pattern
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(example.pattern)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Anchors</h4>
              <ul className="space-y-1 text-xs font-mono">
                <li>^ - Start of string</li>
                <li>$ - End of string</li>
                <li>\\b - Word boundary</li>
                <li>\\B - Non-word boundary</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Character Classes</h4>
              <ul className="space-y-1 text-xs font-mono">
                <li>\\d - Digit</li>
                <li>\\w - Word character</li>
                <li>\\s - Whitespace</li>
                <li>[a-z] - Range</li>
                <li>[^a-z] - Negated range</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Quantifiers</h4>
              <ul className="space-y-1 text-xs font-mono">
                <li>* - 0 or more</li>
                <li>+ - 1 or more</li>
                <li>? - 0 or 1</li>
                <li>{`{n}`} - Exactly n</li>
                <li>{`{n,}`} - n or more</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
