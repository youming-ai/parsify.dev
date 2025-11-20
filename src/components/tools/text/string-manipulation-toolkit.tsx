"use client";

import { Copy, Download, FileText, Random, Scissors, Shuffle, SortAsc, Type } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export type ManipulationType =
  | "reverse"
  | "shuffle"
  | "sort"
  | "deduplicate"
  | "extract"
  | "extract-words"
  | "extract-numbers"
  | "extract-emails"
  | "extract-urls"
  | "extract-phone"
  | "pad"
  | "trim"
  | "remove-spaces"
  | "remove-newlines"
  | "remove-punctuation"
  | "remove-duplicates"
  | "find-replace"
  | "split-join"
  | "repeat";

export interface ManipulationResult {
  original: string;
  processed: string;
  manipulationType: ManipulationType;
  stats: {
    originalLength: number;
    processedLength: number;
    originalWords: number;
    processedWords: number;
    originalLines: number;
    processedLines: number;
    changesCount: number;
  };
  success: boolean;
  error?: string;
}

interface StringManipulationToolkitProps {
  className?: string;
}

const manipulationOptions: {
  type: ManipulationType;
  label: string;
  description: string;
  category: "basic" | "extract" | "clean" | "advanced";
}[] = [
  // Basic
  {
    type: "reverse",
    label: "Reverse",
    description: "Reverse the entire string",
    category: "basic",
  },
  {
    type: "shuffle",
    label: "Shuffle",
    description: "Randomly shuffle characters",
    category: "basic",
  },
  {
    type: "sort",
    label: "Sort",
    description: "Sort characters alphabetically",
    category: "basic",
  },
  {
    type: "pad",
    label: "Padding",
    description: "Add padding to text",
    category: "basic",
  },
  {
    type: "trim",
    label: "Trim",
    description: "Remove whitespace from start/end",
    category: "basic",
  },

  // Extract
  {
    type: "extract",
    label: "Extract by Pattern",
    description: "Extract text matching custom pattern",
    category: "extract",
  },
  {
    type: "extract-words",
    label: "Extract Words",
    description: "Extract all words from text",
    category: "extract",
  },
  {
    type: "extract-numbers",
    label: "Extract Numbers",
    description: "Extract all numbers from text",
    category: "extract",
  },
  {
    type: "extract-emails",
    label: "Extract Emails",
    description: "Extract email addresses",
    category: "extract",
  },
  {
    type: "extract-urls",
    label: "Extract URLs",
    description: "Extract web URLs",
    category: "extract",
  },
  {
    type: "extract-phone",
    label: "Extract Phone Numbers",
    description: "Extract phone numbers",
    category: "extract",
  },

  // Clean
  {
    type: "remove-spaces",
    label: "Remove Spaces",
    description: "Remove all whitespace",
    category: "clean",
  },
  {
    type: "remove-newlines",
    label: "Remove Newlines",
    description: "Remove line breaks",
    category: "clean",
  },
  {
    type: "remove-punctuation",
    label: "Remove Punctuation",
    description: "Remove punctuation marks",
    category: "clean",
  },
  {
    type: "deduplicate",
    label: "Deduplicate Lines",
    description: "Remove duplicate lines",
    category: "clean",
  },
  {
    type: "remove-duplicates",
    label: "Remove Duplicates",
    description: "Remove duplicate words",
    category: "clean",
  },

  // Advanced
  {
    type: "find-replace",
    label: "Find & Replace",
    description: "Find and replace text",
    category: "advanced",
  },
  {
    type: "split-join",
    label: "Split & Join",
    description: "Split text and rejoin with delimiter",
    category: "advanced",
  },
  {
    type: "repeat",
    label: "Repeat",
    description: "Repeat text multiple times",
    category: "advanced",
  },
];

export function StringManipulationToolkit({ className }: StringManipulationToolkitProps) {
  const [inputText, setInputText] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<ManipulationType>("reverse");
  const [result, setResult] = React.useState<ManipulationResult | null>(null);
  const [batchResults, setBatchResults] = React.useState<ManipulationResult[]>([]);
  const [batchMode, setBatchMode] = React.useState(false);

  // Advanced options
  const [findText, setFindText] = React.useState("");
  const [replaceText, setReplaceText] = React.useState("");
  const [customPattern, setCustomPattern] = React.useState("");
  const [paddingChar, setPaddingChar] = React.useState(" ");
  const [paddingLength, setPaddingLength] = React.useState(10);
  const [paddingSide, setPaddingSide] = React.useState<"left" | "right" | "both">("left");
  const [splitDelimiter, setSplitDelimiter] = React.useState(" ");
  const [joinDelimiter, setJoinDelimiter] = React.useState("-");
  const [repeatCount, setRepeatCount] = React.useState(3);
  const [caseSensitive, setCaseSensitive] = React.useState(false);
  const [useRegex, setUseRegex] = React.useState(false);

  const manipulateString = React.useCallback(
    (text: string, type: ManipulationType): string => {
      if (!text.trim()) return text;

      try {
        switch (type) {
          case "reverse":
            return text.split("").reverse().join("");

          case "shuffle":
            const chars = text.split("");
            for (let i = chars.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [chars[i], chars[j]] = [chars[j], chars[i]];
            }
            return chars.join("");

          case "sort":
            return text.split("").sort().join("");

          case "pad":
            const padChar = paddingChar || " ";
            const targetLength = paddingLength;
            const currentLength = text.length;

            if (currentLength >= targetLength) return text;

            const padNeeded = targetLength - currentLength;
            let paddedText = text;

            if (paddingSide === "left") {
              paddedText = padChar.repeat(padNeeded) + text;
            } else if (paddingSide === "right") {
              paddedText = text + padChar.repeat(padNeeded);
            } else {
              const leftPad = Math.floor(padNeeded / 2);
              const rightPad = padNeeded - leftPad;
              paddedText = padChar.repeat(leftPad) + text + padChar.repeat(rightPad);
            }

            return paddedText;

          case "trim":
            return text.trim();

          case "extract":
            if (!customPattern) return text;
            try {
              const regex = new RegExp(customPattern, caseSensitive ? "g" : "gi");
              const matches = text.match(regex) || [];
              return matches.join("\n");
            } catch (error) {
              return `Error in pattern: ${error}`;
            }

          case "extract-words":
            const wordRegex = /\b[a-zA-Z0-9'_-]+\b/g;
            const words = text.match(wordRegex) || [];
            return words.join("\n");

          case "extract-numbers":
            const numberRegex = /\b\d+\.?\d*\b/g;
            const numbers = text.match(numberRegex) || [];
            return numbers.join("\n");

          case "extract-emails":
            const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
            const emails = text.match(emailRegex) || [];
            return emails.join("\n");

          case "extract-urls":
            const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/g;
            const urls = text.match(urlRegex) || [];
            return urls.join("\n");

          case "extract-phone":
            const phoneRegex =
              /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
            const phones = text.match(phoneRegex) || [];
            return phones.join("\n");

          case "remove-spaces":
            return text.replace(/\s/g, "");

          case "remove-newlines":
            return text.replace(/[\r\n]+/g, " ");

          case "remove-punctuation":
            return text.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, "");

          case "deduplicate":
            return Array.from(new Set(text.split("\n"))).join("\n");

          case "remove-duplicates":
            const words2 = text.split(/\s+/);
            const uniqueWords = Array.from(new Set(words2));
            return uniqueWords.join(" ");

          case "find-replace":
            if (!findText) return text;
            const flags = caseSensitive ? "g" : "gi";
            const searchRegex = useRegex
              ? new RegExp(findText, flags)
              : new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
            return text.replace(searchRegex, replaceText);

          case "split-join":
            const parts = text.split(splitDelimiter);
            return parts.join(joinDelimiter);

          case "repeat":
            return text.repeat(repeatCount);

          default:
            return text;
        }
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    [
      customPattern,
      caseSensitive,
      useRegex,
      findText,
      replaceText,
      paddingChar,
      paddingLength,
      paddingSide,
      splitDelimiter,
      joinDelimiter,
      repeatCount,
    ],
  );

  const calculateStats = React.useCallback((original: string, processed: string) => {
    const originalWords = original
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const processedWords = processed
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const originalLines = original.split("\n");
    const processedLines = processed.split("\n");

    const changesCount = original
      .split("")
      .filter((char, index) => processed[index] && char !== processed[index]).length;

    return {
      originalLength: original.length,
      processedLength: processed.length,
      originalWords: originalWords.length,
      processedWords: processedWords.length,
      originalLines: originalLines.length,
      processedLines: processedLines.length,
      changesCount,
    };
  }, []);

  const handleManipulate = React.useCallback(
    (type: ManipulationType) => {
      if (!inputText.trim()) return;

      const processed = manipulateString(inputText, type);
      const stats = calculateStats(inputText, processed);

      const manipulationResult: ManipulationResult = {
        original: inputText,
        processed,
        manipulationType: type,
        stats,
        success: !processed.startsWith("Error:"),
        error: processed.startsWith("Error:") ? processed : undefined,
      };

      if (batchMode) {
        setBatchResults((prev) => {
          const filtered = prev.filter((r) => r.manipulationType !== type);
          return [...filtered, manipulationResult];
        });
      } else {
        setResult(manipulationResult);
      }
    },
    [inputText, manipulateString, calculateStats, batchMode],
  );

  const handleBatchProcess = React.useCallback(() => {
    if (!inputText.trim()) return;

    const basicManipulations: ManipulationType[] = [
      "reverse",
      "shuffle",
      "sort",
      "trim",
      "deduplicate",
      "remove-spaces",
    ];

    const results = basicManipulations.map((type) => {
      const processed = manipulateString(inputText, type);
      const stats = calculateStats(inputText, processed);

      return {
        original: inputText,
        processed,
        manipulationType: type,
        stats,
        success: !processed.startsWith("Error:"),
      } as ManipulationResult;
    });

    setBatchResults(results);
    setBatchMode(true);
  }, [inputText, manipulateString, calculateStats]);

  const copyToClipboard = React.useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (error) {
        console.error("Failed to copy text: ", error);
      }
      document.body.removeChild(textArea);
    }
  }, []);

  const downloadText = React.useCallback((text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const swapInputOutput = React.useCallback(() => {
    if (result?.processed) {
      setInputText(result.processed);
      setResult(null);
    }
  }, [result]);

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              String Manipulation Toolkit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-text">Input Text</Label>
              <Textarea
                id="input-text"
                placeholder="Enter text to manipulate..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[150px]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setBatchMode(!batchMode)}
                variant={batchMode ? "default" : "outline"}
              >
                {batchMode ? "Single Mode" : "Batch Mode"}
              </Button>
              {batchMode && (
                <Button onClick={handleBatchProcess} variant="outline">
                  Apply Basic Operations
                </Button>
              )}
              {result && (
                <Button onClick={swapInputOutput} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Use as Input
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manipulation Options */}
        <Card>
          <CardHeader>
            <CardTitle>Manipulation Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="extract">Extract</TabsTrigger>
                <TabsTrigger value="clean">Clean</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  {manipulationOptions
                    .filter((opt) => opt.category === "basic")
                    .map((option) => (
                      <Button
                        key={option.type}
                        onClick={() => {
                          setSelectedType(option.type);
                          handleManipulate(option.type);
                        }}
                        variant={selectedType === option.type ? "default" : "outline"}
                        className="justify-start h-auto p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium flex items-center gap-2">
                            {option.type === "reverse" && <SortAsc className="h-4 w-4" />}
                            {option.type === "shuffle" && <Shuffle className="h-4 w-4" />}
                            {option.type === "sort" && <SortAsc className="h-4 w-4" />}
                            {option.type === "trim" && <Scissors className="h-4 w-4" />}
                            {option.type === "pad" && <Type className="h-4 w-4" />}
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </Button>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="extract" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  {manipulationOptions
                    .filter((opt) => opt.category === "extract")
                    .map((option) => (
                      <Button
                        key={option.type}
                        onClick={() => {
                          setSelectedType(option.type);
                          handleManipulate(option.type);
                        }}
                        variant={selectedType === option.type ? "default" : "outline"}
                        className="justify-start h-auto p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </Button>
                    ))}
                </div>

                {selectedType === "extract" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-pattern">Custom Pattern (Regex)</Label>
                    <Input
                      id="custom-pattern"
                      placeholder="Enter regex pattern..."
                      value={customPattern}
                      onChange={(e) => setCustomPattern(e.target.value)}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="clean" className="space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  {manipulationOptions
                    .filter((opt) => opt.category === "clean")
                    .map((option) => (
                      <Button
                        key={option.type}
                        onClick={() => {
                          setSelectedType(option.type);
                          handleManipulate(option.type);
                        }}
                        variant={selectedType === option.type ? "default" : "outline"}
                        className="justify-start h-auto p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </Button>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  {manipulationOptions
                    .filter((opt) => opt.category === "advanced")
                    .map((option) => (
                      <Button
                        key={option.type}
                        onClick={() => {
                          setSelectedType(option.type);
                          handleManipulate(option.type);
                        }}
                        variant={selectedType === option.type ? "default" : "outline"}
                        className="justify-start h-auto p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </Button>
                    ))}
                </div>

                {/* Advanced Options */}
                <div className="border-t pt-4 space-y-4">
                  {selectedType === "find-replace" && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="find-text">Find Text</Label>
                        <Input
                          id="find-text"
                          placeholder="Text to find..."
                          value={findText}
                          onChange={(e) => setFindText(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="replace-text">Replace With</Label>
                        <Input
                          id="replace-text"
                          placeholder="Replacement text..."
                          value={replaceText}
                          onChange={(e) => setReplaceText(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch checked={caseSensitive} onCheckedChange={setCaseSensitive} />
                          <Label>Case Sensitive</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch checked={useRegex} onCheckedChange={setUseRegex} />
                          <Label>Use Regex</Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedType === "pad" && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="padding-char">Padding Character</Label>
                        <Input
                          id="padding-char"
                          placeholder="Padding character..."
                          value={paddingChar}
                          onChange={(e) => setPaddingChar(e.target.value)}
                          maxLength={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Padding Length: {paddingLength}</Label>
                        <Slider
                          value={[paddingLength]}
                          onValueChange={([value]) => setPaddingLength(value)}
                          max={50}
                          min={1}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Padding Side</Label>
                        <Select
                          value={paddingSide}
                          onValueChange={(value) =>
                            setPaddingSide(value as "left" | "right" | "both")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {selectedType === "split-join" && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="split-delimiter">Split Delimiter</Label>
                        <Input
                          id="split-delimiter"
                          placeholder="Character to split on..."
                          value={splitDelimiter}
                          onChange={(e) => setSplitDelimiter(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="join-delimiter">Join Delimiter</Label>
                        <Input
                          id="join-delimiter"
                          placeholder="Character to join with..."
                          value={joinDelimiter}
                          onChange={(e) => setJoinDelimiter(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {selectedType === "repeat" && (
                    <div className="space-y-2">
                      <Label>Repeat Count: {repeatCount}</Label>
                      <Slider
                        value={[repeatCount]}
                        onValueChange={([value]) => setRepeatCount(value)}
                        max={10}
                        min={1}
                        step={1}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Results */}
        {batchMode && batchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Batch Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {batchResults.map((batchResult, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium capitalize">
                        {batchResult.manipulationType.replace("-", " ")}
                      </h4>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(batchResult.processed)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            downloadText(
                              batchResult.processed,
                              `${batchResult.manipulationType}.txt`,
                            )
                          }
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {batchResult.stats.changesCount} changes • {batchResult.stats.processedLength}{" "}
                      chars
                    </div>
                    <div className="font-mono text-xs bg-gray-50 p-2 rounded max-h-20 overflow-auto">
                      {batchResult.processed || "(empty)"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!batchMode && result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Manipulation Result</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(result.processed)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadText(result.processed, `${result.manipulationType}.txt`)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Operation:</span>{" "}
                  <span className="capitalize">{result.manipulationType.replace("-", " ")}</span>
                </div>
                <div>
                  <span className="font-medium">Length:</span> {result.stats.originalLength} →{" "}
                  {result.stats.processedLength}
                </div>
                <div>
                  <span className="font-medium">Words:</span> {result.stats.originalWords} →{" "}
                  {result.stats.processedWords}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Processed Text</Label>
                <Textarea value={result.processed} readOnly className="min-h-[150px] font-mono" />
              </div>

              {result.error && <div className="text-red-600 text-sm">{result.error}</div>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
