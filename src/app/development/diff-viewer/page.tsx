'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeftRight,
  Check,
  ClipboardCopy,
  FileCode,
  GitCompare,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

type DiffMode = 'inline' | 'side-by-side';

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'modified';
  lineNumber: { left: number | null; right: number | null };
  content: string;
  originalContent?: string;
}

const SAMPLE_ORIGINAL = `function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price;
  }
  return total;
}

const result = calculateTotal(cartItems);
console.log(result);`;

const SAMPLE_MODIFIED = `function calculateTotal(items, discount = 0) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  return total * (1 - discount);
}

// Apply 10% discount
const result = calculateTotal(cartItems, 0.1);
console.log("Total:", result);`;

function computeDiff(original: string, modified: string): DiffLine[] {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  const result: DiffLine[] = [];

  // Simple LCS-based diff algorithm
  const m = originalLines.length;
  const n = modifiedLines.length;

  // Build LCS table
  const lcs: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (originalLines[i - 1] === modifiedLines[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  let i = m;
  let j = n;
  const diffStack: DiffLine[] = [];
  let leftLine = m;
  let rightLine = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalLines[i - 1] === modifiedLines[j - 1]) {
      diffStack.push({
        type: 'unchanged',
        lineNumber: { left: leftLine, right: rightLine },
        content: originalLines[i - 1],
      });
      i--;
      j--;
      leftLine--;
      rightLine--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      diffStack.push({
        type: 'added',
        lineNumber: { left: null, right: rightLine },
        content: modifiedLines[j - 1],
      });
      j--;
      rightLine--;
    } else if (i > 0) {
      diffStack.push({
        type: 'removed',
        lineNumber: { left: leftLine, right: null },
        content: originalLines[i - 1],
      });
      i--;
      leftLine--;
    }
  }

  // Reverse to get correct order
  while (diffStack.length > 0) {
    const line = diffStack.pop()!;
    result.push(line);
  }

  return result;
}

export default function DiffViewerPage() {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [diffMode, setDiffMode] = useState<DiffMode>('side-by-side');
  const [copied, setCopied] = useState(false);

  const diffLines = useMemo(() => {
    return computeDiff(originalText, modifiedText);
  }, [originalText, modifiedText]);

  const stats = useMemo(() => {
    const added = diffLines.filter((l) => l.type === 'added').length;
    const removed = diffLines.filter((l) => l.type === 'removed').length;
    const unchanged = diffLines.filter((l) => l.type === 'unchanged').length;
    return { added, removed, unchanged };
  }, [diffLines]);

  const handleLoadSample = useCallback(() => {
    setOriginalText(SAMPLE_ORIGINAL);
    setModifiedText(SAMPLE_MODIFIED);
  }, []);

  const handleSwap = useCallback(() => {
    const temp = originalText;
    setOriginalText(modifiedText);
    setModifiedText(temp);
  }, [originalText, modifiedText]);

  const handleClear = useCallback(() => {
    setOriginalText('');
    setModifiedText('');
  }, []);

  const handleCopyDiff = useCallback(async () => {
    const diffText = diffLines
      .map((line) => {
        if (line.type === 'added') return `+ ${line.content}`;
        if (line.type === 'removed') return `- ${line.content}`;
        return `  ${line.content}`;
      })
      .join('\n');
    await navigator.clipboard.writeText(diffText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [diffLines]);

  const getLineClass = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'removed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default:
        return '';
    }
  };

  const getLineIcon = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return <Plus className="h-3 w-3 text-green-600" />;
      case 'removed':
        return <Minus className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
                <GitCompare className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Diff Viewer</CardTitle>
                <CardDescription>Compare text and code differences side by side</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Compare</Badge>
              <Badge variant="outline">Offline</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-slate-50 p-4 dark:bg-slate-800">
            <div className="space-y-1">
              <Label>View Mode</Label>
              <Select value={diffMode} onValueChange={(v) => setDiffMode(v as DiffMode)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="side-by-side">Side by Side</SelectItem>
                  <SelectItem value="inline">Inline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleLoadSample}>
                <FileCode className="mr-2 h-4 w-4" />
                Load Sample
              </Button>
              <Button variant="outline" onClick={handleSwap}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Swap
              </Button>
              <Button variant="outline" onClick={handleClear}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
              {diffLines.length > 0 && (originalText || modifiedText) && (
                <Button variant="outline" onClick={handleCopyDiff}>
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy Diff'}
                </Button>
              )}
            </div>
          </div>

          {/* Input Areas */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Original Text</Label>
              <Textarea
                placeholder="Paste original text here..."
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Modified Text</Label>
              <Textarea
                placeholder="Paste modified text here..."
                value={modifiedText}
                onChange={(e) => setModifiedText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
          </div>

          {/* Stats */}
          {(originalText || modifiedText) && (
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-green-600">
                <Plus className="mr-1 h-3 w-3" />
                {stats.added} added
              </Badge>
              <Badge variant="outline" className="text-red-600">
                <Minus className="mr-1 h-3 w-3" />
                {stats.removed} removed
              </Badge>
              <Badge variant="outline">{stats.unchanged} unchanged</Badge>
            </div>
          )}

          {/* Diff View */}
          {(originalText || modifiedText) && (
            <div className="space-y-2">
              <Label>Diff Result</Label>
              <Tabs value={diffMode} onValueChange={(v) => setDiffMode(v as DiffMode)}>
                <TabsList>
                  <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                  <TabsTrigger value="inline">Inline</TabsTrigger>
                </TabsList>

                <TabsContent value="side-by-side">
                  <div className="grid grid-cols-2 overflow-hidden rounded-lg border">
                    {/* Left (Original) */}
                    <div className="border-r">
                      <div className="border-b bg-slate-100 px-4 py-2 text-sm font-medium dark:bg-slate-800">
                        Original
                      </div>
                      <div className="max-h-[400px] overflow-auto bg-slate-50 dark:bg-slate-900">
                        {diffLines.map((line, idx) => (
                          <div
                            key={`left-${idx}`}
                            className={`flex min-h-[24px] items-center border-b border-slate-200 dark:border-slate-700 ${
                              line.type === 'removed' ? getLineClass('removed') : ''
                            }`}
                          >
                            <span className="w-10 flex-shrink-0 px-2 text-right text-xs text-slate-400">
                              {line.lineNumber.left ?? ''}
                            </span>
                            <span className="w-6 flex-shrink-0">
                              {line.type === 'removed' && getLineIcon('removed')}
                            </span>
                            {line.type !== 'added' && (
                              <code className="flex-1 whitespace-pre px-2 text-sm">
                                {line.content}
                              </code>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right (Modified) */}
                    <div>
                      <div className="border-b bg-slate-100 px-4 py-2 text-sm font-medium dark:bg-slate-800">
                        Modified
                      </div>
                      <div className="max-h-[400px] overflow-auto bg-slate-50 dark:bg-slate-900">
                        {diffLines.map((line, idx) => (
                          <div
                            key={`right-${idx}`}
                            className={`flex min-h-[24px] items-center border-b border-slate-200 dark:border-slate-700 ${
                              line.type === 'added' ? getLineClass('added') : ''
                            }`}
                          >
                            <span className="w-10 flex-shrink-0 px-2 text-right text-xs text-slate-400">
                              {line.lineNumber.right ?? ''}
                            </span>
                            <span className="w-6 flex-shrink-0">
                              {line.type === 'added' && getLineIcon('added')}
                            </span>
                            {line.type !== 'removed' && (
                              <code className="flex-1 whitespace-pre px-2 text-sm">
                                {line.content}
                              </code>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="inline">
                  <div className="overflow-hidden rounded-lg border">
                    <div className="max-h-[500px] overflow-auto bg-slate-50 dark:bg-slate-900">
                      {diffLines.map((line, idx) => (
                        <div
                          key={`inline-${idx}`}
                          className={`flex items-center border-b border-slate-200 dark:border-slate-700 ${getLineClass(line.type)}`}
                        >
                          <span className="w-10 flex-shrink-0 px-2 text-right text-xs text-slate-400">
                            {line.lineNumber.left ?? ''}
                          </span>
                          <span className="w-10 flex-shrink-0 px-2 text-right text-xs text-slate-400">
                            {line.lineNumber.right ?? ''}
                          </span>
                          <span className="w-6 flex-shrink-0">{getLineIcon(line.type)}</span>
                          <code className="flex-1 whitespace-pre px-2 text-sm">{line.content}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Empty State */}
          {!originalText && !modifiedText && (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
              <GitCompare className="mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-500">Paste text in both fields to see the diff</p>
              <Button variant="link" size="sm" onClick={handleLoadSample}>
                Or load sample data
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
