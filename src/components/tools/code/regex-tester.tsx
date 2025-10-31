"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CodeEditor } from "@/components/tools/code/code-editor";
import { Terminal } from "lucide-react";

export interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
}

export interface RegexTestResult {
  isValid: boolean;
  error?: string;
  matches: RegexMatch[];
  totalMatches: number;
  testText: string;
  pattern: string;
  flags: string[];
}

interface RegexTesterProps {
  value?: string;
  onChange?: (result: RegexTestResult) => void;
  height?: number;
  className?: string;
}

// Common regex patterns
const commonPatterns = [
  {
    name: "Email",
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    description: "Valid email addresses",
  },
  {
    name: "URL",
    pattern:
      "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
    description: "HTTP/HTTPS URLs",
  },
  {
    name: "Phone (US)",
    pattern:
      "^(\\+1[-.\\s]?)?\\(?([0-9]{3})\\)?[-.\\s]?([0-9]{3})[-.\\s]?([0-9]{4})$",
    description: "US phone numbers",
  },
  {
    name: "Date (YYYY-MM-DD)",
    pattern: "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$",
    description: "ISO date format",
  },
  {
    name: "IPv4 Address",
    pattern:
      "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
    description: "IPv4 addresses",
  },
  {
    name: "Username",
    pattern: "^[a-zA-Z0-9_]{3,20}$",
    description: "3-20 chars, letters, numbers, underscore",
  },
  {
    name: "Strong Password",
    pattern:
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
    description: "8+ chars with uppercase, lowercase, number, special char",
  },
  {
    name: "HTML Tags",
    pattern: "<([a-z1-6]+)([^<]+)*(?:>(.*)<\\/\\1>| *\\/>)",
    description: "Extract HTML tags",
  },
];

const defaultFlags = ["g", "i", "m", "s", "u", "y"];

export function RegexTester({
  value,
  onChange,
  height = 400,
  className,
}: RegexTesterProps) {
  const [pattern, setPattern] = React.useState("");
  const [testText, setTestText] = React.useState("");
  const [flags, setFlags] = React.useState<string[]>(["g"]);
  const [result, setResult] = React.useState<RegexTestResult>({
    isValid: false,
    matches: [],
    totalMatches: 0,
    testText: "",
    pattern: "",
    flags: ["g"],
  });

  // Test regex pattern
  const testRegex = React.useCallback(() => {
    if (!pattern) {
      const emptyResult: RegexTestResult = {
        isValid: false,
        error: "Pattern is required",
        matches: [],
        totalMatches: 0,
        testText,
        pattern,
        flags,
      };
      setResult(emptyResult);
      onChange?.(emptyResult);
      return;
    }

    try {
      const regex = new RegExp(pattern, flags.join(""));
      const matches: RegexMatch[] = [];
      let match;

      // Find all matches
      while ((match = regex.exec(testText)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
        });

        // Avoid infinite loops for patterns with zero-length matches
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }

      const testResult: RegexTestResult = {
        isValid: true,
        matches,
        totalMatches: matches.length,
        testText,
        pattern,
        flags,
      };

      setResult(testResult);
      onChange?.(testResult);
    } catch (error) {
      const errorResult: RegexTestResult = {
        isValid: false,
        error: error instanceof Error ? error.message : "Invalid regex pattern",
        matches: [],
        totalMatches: 0,
        testText,
        pattern,
        flags,
      };

      setResult(errorResult);
      onChange?.(errorResult);
    }
  }, [pattern, testText, flags, onChange]);

  // Auto-test when pattern, flags, or test text changes
  React.useEffect(() => {
    const timer = setTimeout(testRegex, 300); // Debounce 300ms
    return () => clearTimeout(timer);
  }, [testRegex]);

  const toggleFlag = (flag: string) => {
    setFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag],
    );
  };

  const loadPattern = (selectedPattern: string) => {
    const patternObj = commonPatterns.find(
      (p) => p.pattern === selectedPattern,
    );
    if (patternObj) {
      setPattern(patternObj.pattern);
      setTestText(patternObj.description);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Pattern Input */}
        <div className="space-y-2">
          <Label htmlFor="regex-pattern">Regular Expression</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <CodeEditor
                language="javascript"
                value={pattern}
                onChange={setPattern}
                onLanguageChange={() => {}}
                height={60}
              />
            </div>
            <Select onValueChange={loadPattern}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Common patterns" />
              </SelectTrigger>
              <SelectContent>
                {commonPatterns.map((p) => (
                  <SelectItem key={p.pattern} value={p.pattern}>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        {p.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {result.error && (
            <div className="text-red-600 text-sm">{result.error}</div>
          )}
        </div>

        {/* Flags */}
        <div className="space-y-2">
          <Label>Flags</Label>
          <div className="flex flex-wrap gap-2">
            {defaultFlags.map((flag) => (
              <Badge
                key={flag}
                variant={flags.includes(flag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleFlag(flag)}
              >
                {flag}
                {flag === "g" && " (global)"}
                {flag === "i" && " (ignore case)"}
                {flag === "m" && " (multiline)"}
                {flag === "s" && " (dotall)"}
                {flag === "u" && " (unicode)"}
                {flag === "y" && " (sticky)"}
              </Badge>
            ))}
          </div>
        </div>

        {/* Test Text */}
        <div className="space-y-2">
          <Label htmlFor="test-text">Test Text</Label>
          <CodeEditor
            language="javascript"
            value={testText}
            onChange={setTestText}
            onLanguageChange={() => {}}
            height={height}
          />
        </div>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.isValid ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant="default">
                    {result.totalMatches}{" "}
                    {result.totalMatches === 1 ? "match" : "matches"}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Pattern: /{pattern}/{flags.join("")}
                  </span>
                </div>

                {result.matches.length > 0 ? (
                  <Tabs defaultValue="matches" className="w-full">
                    <TabsList>
                      <TabsTrigger value="matches">Matches</TabsTrigger>
                      <TabsTrigger value="groups">Groups</TabsTrigger>
                      <TabsTrigger value="highlighted">
                        Highlighted Text
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="matches" className="space-y-2">
                      {result.matches.map((match, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 rounded border"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Match {index + 1}</Badge>
                            <span className="text-sm text-gray-600">
                              Index: {match.index}
                            </span>
                          </div>
                          <div className="font-mono text-sm bg-white p-2 rounded border">
                            {match.match}
                          </div>
                          {match.groups.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <span className="text-sm font-medium">
                                Groups:
                              </span>
                              {match.groups.map((group, groupIndex) => (
                                <div
                                  key={groupIndex}
                                  className="font-mono text-xs bg-blue-50 p-1 rounded"
                                >
                                  Group {groupIndex + 1}: {group || "(empty)"}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="groups" className="space-y-2">
                      {result.matches.map((match, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 rounded border"
                        >
                          <Badge variant="outline" className="mb-2">
                            Match {index + 1}
                          </Badge>
                          {match.groups.length > 0 ? (
                            <div className="space-y-2">
                              {match.groups.map((group, groupIndex) => (
                                <div
                                  key={groupIndex}
                                  className="flex items-center gap-2"
                                >
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    ${groupIndex + 1}
                                  </Badge>
                                  <span className="font-mono text-sm">
                                    {group || "(empty)"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 text-sm">
                              No capture groups
                            </div>
                          )}
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="highlighted">
                      <div className="font-mono text-sm whitespace-pre-wrap p-3 bg-gray-50 rounded border">
                        {(() => {
                          let highlightedText = testText;
                          let offset = 0;

                          result.matches.forEach((match) => {
                            const start = match.index + offset;
                            const end = start + match.match.length;
                            const before = highlightedText.substring(0, start);
                            const matchText = highlightedText.substring(
                              start,
                              end,
                            );
                            const after = highlightedText.substring(end);

                            highlightedText =
                              before +
                              '<mark class="bg-yellow-200 px-1 rounded">' +
                              matchText +
                              "</mark>" +
                              after;

                            offset +=
                              '<mark class="bg-yellow-200 px-1 rounded">'
                                .length + "</mark>".length;
                          });

                          return (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: highlightedText,
                              }}
                              className="whitespace-pre-wrap"
                            />
                          );
                        })()}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    No matches found
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600 text-center py-4">
                {result.error || "Invalid pattern"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={testRegex} variant="outline">
            Run Test
          </Button>
          <Button
            onClick={() => {
              setPattern("");
              setTestText("");
              setFlags(["g"]);
              setResult({
                isValid: false,
                matches: [],
                totalMatches: 0,
                testText: "",
                pattern: "",
                flags: ["g"],
              });
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
