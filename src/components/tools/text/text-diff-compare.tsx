"use client";

import { Copy, Download, FileText, GitCompare, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export type DiffType = "character" | "word" | "line";
export type DiffMode = "unified" | "split" | "side-by-side";

export interface DiffBlock {
  type: "addition" | "deletion" | "unchanged" | "header";
  content: string;
  lineNumber?: number;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffResult {
  originalText: string;
  newText: string;
  blocks: DiffBlock[];
  stats: {
    additions: number;
    deletions: number;
    unchanged: number;
    totalLines: number;
    changesPercentage: number;
  };
  similarity: number;
  diffType: DiffType;
  diffMode: DiffMode;
}

interface TextDiffCompareProps {
  className?: string;
}

const diffColors = {
  addition: "bg-green-100 text-green-800 border-l-4 border-green-500",
  deletion: "bg-red-100 text-red-800 border-l-4 border-red-500 line-through",
  unchanged: "bg-gray-50 text-gray-800 border-l-4 border-gray-300",
  header: "bg-blue-100 text-blue-800 border-l-4 border-blue-500 font-semibold",
};

export function TextDiffCompare({ className }: TextDiffCompareProps) {
  const [originalText, setOriginalText] = React.useState("");
  const [newText, setNewText] = React.useState("");
  const [diffResult, setDiffResult] = React.useState<DiffResult | null>(null);
  const [diffType, setDiffType] = React.useState<DiffType>("line");
  const [diffMode, setDiffMode] = React.useState<DiffMode>("unified");
  const [ignoreWhitespace, setIgnoreWhitespace] = React.useState(false);
  const [ignoreCase, setIgnoreCase] = React.useState(false);
  const [showLineNumbers, setShowLineNumbers] = React.useState(true);
  const [contextLines, setContextLines] = React.useState(3);
  const [zoomLevel, setZoomLevel] = React.useState(100);

  const calculateDiff = React.useCallback(
    (oldText: string, newText: string, type: DiffType): DiffBlock[] => {
      const oldArray =
        type === "line"
          ? oldText.split("\n")
          : type === "word"
            ? oldText.split(/\s+/)
            : oldText.split("");

      const newArray =
        type === "line"
          ? newText.split("\n")
          : type === "word"
            ? newText.split(/\s+/)
            : newText.split("");

      const blocks: DiffBlock[] = [];
      let oldIndex = 0;
      let newIndex = 0;

      // Simple diff algorithm - in production, you'd use a more sophisticated algorithm like Myers
      const m = oldArray.length;
      const n = newArray.length;
      const dp: number[][] = Array(m + 1)
        .fill(null)
        .map(() => Array(n + 1).fill(0));

      // Build DP table for longest common subsequence
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          let oldItem = oldArray[i - 1];
          let newItem = newArray[j - 1];

          if (ignoreWhitespace) {
            oldItem = oldItem.trim();
            newItem = newItem.trim();
          }

          if (ignoreCase) {
            oldItem = oldItem.toLowerCase();
            newItem = newItem.toLowerCase();
          }

          if (oldItem === newItem) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }

      // Reconstruct diff
      let i = m,
        j = n;
      const sequence: {
        type: "addition" | "deletion" | "unchanged";
        oldIndex?: number;
        newIndex?: number;
      }[] = [];

      while (i > 0 || j > 0) {
        if (i > 0 && j > 0) {
          let oldItem = oldArray[i - 1];
          let newItem = newArray[j - 1];

          if (ignoreWhitespace) {
            oldItem = oldItem.trim();
            newItem = newItem.trim();
          }

          if (ignoreCase) {
            oldItem = oldItem.toLowerCase();
            newItem = newItem.toLowerCase();
          }

          if (oldItem === newItem) {
            sequence.push({ type: "unchanged", oldIndex: i - 1, newIndex: j - 1 });
            i--;
            j--;
            continue;
          }
        }

        if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          sequence.push({ type: "addition", newIndex: j - 1 });
          j--;
        } else if (i > 0 && (j === 0 || dp[i - 1][j] > dp[i][j - 1])) {
          sequence.push({ type: "deletion", oldIndex: i - 1 });
          i--;
        }
      }

      sequence.reverse();

      // Build diff blocks with context
      let currentOldLine = 1;
      let currentNewLine = 1;
      let iSequence = 0;

      while (iSequence < sequence.length) {
        const item = sequence[iSequence];

        if (item.type === "unchanged") {
          blocks.push({
            type: "unchanged",
            content: oldArray[item.oldIndex!],
            lineNumber: type === "line" ? currentOldLine++ : undefined,
            oldLineNumber: type === "line" ? currentOldLine++ : undefined,
            newLineNumber: type === "line" ? currentNewLine++ : undefined,
          });
          iSequence++;
        } else {
          // Collect consecutive additions/deletions
          const deletionBlock: string[] = [];
          const additionBlock: string[] = [];

          while (iSequence < sequence.length && sequence[iSequence].type === "deletion") {
            const delItem = sequence[iSequence];
            deletionBlock.push(oldArray[delItem.oldIndex!]);
            iSequence++;
          }

          while (iSequence < sequence.length && sequence[iSequence].type === "addition") {
            const addItem = sequence[iSequence];
            additionBlock.push(newArray[addItem.newIndex!]);
            iSequence++;
          }

          // Add header for significant changes
          if ((deletionBlock.length > 0 || additionBlock.length > 0) && type === "line") {
            blocks.push({
              type: "header",
              content: `@@ -${currentOldLine},${deletionBlock.length || 1} +${currentNewLine},${additionBlock.length || 1} @@`,
            });
          }

          // Add deletions
          deletionBlock.forEach((content) => {
            blocks.push({
              type: "deletion",
              content,
              lineNumber: type === "line" ? currentOldLine : undefined,
              oldLineNumber: type === "line" ? currentOldLine++ : undefined,
            });
          });

          // Add additions
          additionBlock.forEach((content) => {
            blocks.push({
              type: "addition",
              content,
              lineNumber: type === "line" ? currentNewLine : undefined,
              newLineNumber: type === "line" ? currentNewLine++ : undefined,
            });
          });
        }
      }

      return blocks;
    },
    [ignoreWhitespace, ignoreCase],
  );

  const calculateStats = React.useCallback((blocks: DiffBlock[]) => {
    let additions = 0;
    let deletions = 0;
    let unchanged = 0;

    blocks.forEach((block) => {
      switch (block.type) {
        case "addition":
          additions++;
          break;
        case "deletion":
          deletions++;
          break;
        case "unchanged":
          unchanged++;
          break;
      }
    });

    const totalLines = blocks.length;
    const totalChanges = additions + deletions;
    const changesPercentage = totalLines > 0 ? (totalChanges / totalLines) * 100 : 0;

    return {
      additions,
      deletions,
      unchanged,
      totalLines,
      changesPercentage,
    };
  }, []);

  const calculateSimilarity = React.useCallback((oldText: string, newText: string): number => {
    const oldArray = oldText.split("");
    const newArray = newText.split("");

    const m = oldArray.length;
    const n = newArray.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    // Calculate edit distance
    for (let i = 1; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 1; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oldArray[i - 1] === newArray[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1, // deletion
            dp[i][j - 1] + 1, // insertion
            dp[i - 1][j - 1] + 1, // substitution
          );
        }
      }
    }

    const editDistance = dp[m][n];
    const maxLength = Math.max(m, n);
    const similarity = maxLength > 0 ? ((maxLength - editDistance) / maxLength) * 100 : 100;

    return similarity;
  }, []);

  const handleDiff = React.useCallback(() => {
    const blocks = calculateDiff(originalText, newText, diffType);
    const stats = calculateStats(blocks);
    const similarity = calculateSimilarity(originalText, newText);

    setDiffResult({
      originalText,
      newText,
      blocks,
      stats,
      similarity,
      diffType,
      diffMode,
    });
  }, [
    originalText,
    newText,
    diffType,
    diffMode,
    calculateDiff,
    calculateStats,
    calculateSimilarity,
  ]);

  const swapTexts = React.useCallback(() => {
    const temp = originalText;
    setOriginalText(newText);
    setNewText(temp);
  }, [originalText, newText]);

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

  const downloadDiff = React.useCallback(() => {
    if (!diffResult) return;

    let diffText = `Diff Comparison\n`;
    diffText += `Similarity: ${diffResult.similarity.toFixed(1)}%\n`;
    diffText += `Additions: ${diffResult.stats.additions}, Deletions: ${diffResult.stats.deletions}\n`;
    diffText += `Date: ${new Date().toISOString()}\n\n`;

    diffResult.blocks.forEach((block, index) => {
      const prefix =
        block.type === "addition"
          ? "+"
          : block.type === "deletion"
            ? "-"
            : block.type === "unchanged"
              ? " "
              : "@@";
      diffText += `${prefix}${block.content}\n`;
    });

    const blob = new Blob([diffText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diff-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [diffResult]);

  const renderUnifiedDiff = React.useCallback(() => {
    if (!diffResult) return null;

    return (
      <div className="space-y-0 font-mono text-sm" style={{ fontSize: `${zoomLevel}%` }}>
        {diffResult.blocks.map((block, index) => (
          <div key={index} className={`p-2 ${diffColors[block.type]} flex items-start gap-2`}>
            {showLineNumbers && block.type !== "header" && (
              <div className="text-xs opacity-60 w-16 text-right">
                {block.oldLineNumber !== undefined && block.newLineNumber !== undefined ? (
                  <span>
                    {block.oldLineNumber || ""},{block.newLineNumber || ""}
                  </span>
                ) : block.oldLineNumber !== undefined ? (
                  <span>{block.oldLineNumber}</span>
                ) : block.newLineNumber !== undefined ? (
                  <span>{block.newLineNumber}</span>
                ) : (
                  ""
                )}
              </div>
            )}
            <div className="flex-1">
              {block.type === "addition" && <span className="mr-1">+</span>}
              {block.type === "deletion" && <span className="mr-1">-</span>}
              {block.type === "unchanged" && <span className="mr-1"> </span>}
              {block.content ||
                (block.type === "deletion" && <span className="opacity-50">(empty line)</span>)}
            </div>
          </div>
        ))}
      </div>
    );
  }, [diffResult, showLineNumbers, zoomLevel]);

  const renderSideBySideDiff = React.useCallback(() => {
    if (!diffResult) return null;

    const leftBlocks: DiffBlock[] = [];
    const rightBlocks: DiffBlock[] = [];

    diffResult.blocks.forEach((block) => {
      if (block.type === "addition") {
        leftBlocks.push({ ...block, content: "", type: "unchanged" });
        rightBlocks.push(block);
      } else if (block.type === "deletion") {
        leftBlocks.push(block);
        rightBlocks.push({ ...block, content: "", type: "unchanged" });
      } else {
        leftBlocks.push(block);
        rightBlocks.push({ ...block, content: block.content });
      }
    });

    return (
      <div
        className="grid grid-cols-2 gap-4 font-mono text-sm"
        style={{ fontSize: `${zoomLevel}%` }}
      >
        <div className="space-y-0">
          <h4 className="font-bold text-gray-700 p-2 bg-gray-100">Original</h4>
          {leftBlocks.map((block, index) => (
            <div
              key={`left-${index}`}
              className={`p-2 ${diffColors[block.type]} flex items-start gap-2`}
            >
              {showLineNumbers && block.type !== "header" && (
                <div className="text-xs opacity-60 w-8 text-right">{block.oldLineNumber || ""}</div>
              )}
              <div className="flex-1">
                {block.type === "deletion" && <span className="mr-1">-</span>}
                {block.content ||
                  (block.type === "deletion" && <span className="opacity-50">(removed)</span>)}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-0">
          <h4 className="font-bold text-gray-700 p-2 bg-gray-100">New</h4>
          {rightBlocks.map((block, index) => (
            <div
              key={`right-${index}`}
              className={`p-2 ${diffColors[block.type]} flex items-start gap-2`}
            >
              {showLineNumbers && block.type !== "header" && (
                <div className="text-xs opacity-60 w-8 text-right">{block.newLineNumber || ""}</div>
              )}
              <div className="flex-1">
                {block.type === "addition" && <span className="mr-1">+</span>}
                {block.content ||
                  (block.type === "addition" && <span className="opacity-50">(added)</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [diffResult, showLineNumbers, zoomLevel]);

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Text Diff & Compare
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="original-text">Original Text</Label>
                <Textarea
                  id="original-text"
                  placeholder="Enter original text..."
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  className="min-h-[200px] font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-text">New Text</Label>
                <Textarea
                  id="new-text"
                  placeholder="Enter new text..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="min-h-[200px] font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDiff} disabled={!originalText && !newText}>
                <GitCompare className="h-4 w-4 mr-2" />
                Compare Texts
              </Button>
              <Button onClick={swapTexts} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Swap Texts
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle>Diff Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Granularity</Label>
                <Select value={diffType} onValueChange={(value) => setDiffType(value as DiffType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="character">Character</SelectItem>
                    <SelectItem value="word">Word</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Display Mode</Label>
                <Select value={diffMode} onValueChange={(value) => setDiffMode(value as DiffMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unified">Unified</SelectItem>
                    <SelectItem value="split">Split</SelectItem>
                    <SelectItem value="side-by-side">Side by Side</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch checked={ignoreWhitespace} onCheckedChange={setIgnoreWhitespace} />
                <Label>Ignore Whitespace</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch checked={ignoreCase} onCheckedChange={setIgnoreCase} />
                <Label>Ignore Case</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch checked={showLineNumbers} onCheckedChange={setShowLineNumbers} />
                <Label>Show Line Numbers</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {diffResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Comparison Results</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">{zoomLevel}%</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadDiff}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Statistics */}
              <div className="grid md:grid-cols-6 gap-4 text-sm">
                <div>
                  <span className="font-medium">Similarity:</span>{" "}
                  <span
                    className={`font-bold ${diffResult.similarity > 80 ? "text-green-600" : diffResult.similarity > 50 ? "text-yellow-600" : "text-red-600"}`}
                  >
                    {diffResult.similarity.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="font-medium">Additions:</span>{" "}
                  <span className="text-green-600 font-medium">+{diffResult.stats.additions}</span>
                </div>
                <div>
                  <span className="font-medium">Deletions:</span>{" "}
                  <span className="text-red-600 font-medium">-{diffResult.stats.deletions}</span>
                </div>
                <div>
                  <span className="font-medium">Unchanged:</span>{" "}
                  <span className="text-gray-600 font-medium">{diffResult.stats.unchanged}</span>
                </div>
                <div>
                  <span className="font-medium">Total:</span>{" "}
                  <span className="font-medium">{diffResult.stats.totalLines}</span>
                </div>
                <div>
                  <span className="font-medium">Changed:</span>{" "}
                  <span className="font-medium">
                    {diffResult.stats.changesPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Diff Display */}
              <div className="border rounded-lg overflow-auto max-h-[600px]">
                <Tabs value={diffMode} onValueChange={(value) => setDiffMode(value as DiffMode)}>
                  <TabsList className="sticky top-0 z-10 bg-white border-b">
                    <TabsTrigger value="unified">Unified</TabsTrigger>
                    <TabsTrigger value="split">Split</TabsTrigger>
                    <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                  </TabsList>

                  <TabsContent value="unified" className="m-0">
                    {renderUnifiedDiff()}
                  </TabsContent>

                  <TabsContent value="split" className="m-0">
                    {renderUnifiedDiff()}
                  </TabsContent>

                  <TabsContent value="side-by-side" className="m-0">
                    {renderSideBySideDiff()}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Summary */}
              <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Summary</h4>
                <p>
                  The comparison shows {diffResult.stats.changesPercentage.toFixed(1)}% changes
                  between the texts.
                  {diffResult.similarity > 80 && " The texts are very similar."}
                  {diffResult.similarity > 50 &&
                    diffResult.similarity <= 80 &&
                    " The texts are moderately similar."}
                  {diffResult.similarity <= 50 && " The texts are significantly different."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
