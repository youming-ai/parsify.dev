'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowsClockwise,
  CheckCircle,
  Copy,
  GitBranch,
  Minus,
  Plus,
  Swap,
  Trash,
} from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

type DiffMode = 'unified' | 'split';

const sampleTextA = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const result = greet("World");
console.log(result);`;

const sampleTextB = `function greet(name, greeting = "Hello") {
  console.log(greeting + ", " + name + "!");
  return { success: true, name };
}

const result = greet("World", "Hi");
console.log(result.success);`;

const DiffViewer = () => {
  const [textA, setTextA] = useState(sampleTextA);
  const [textB, setTextB] = useState(sampleTextB);
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [diffMode, setDiffMode] = useState<DiffMode>('split');
  const [copied, setCopied] = useState(false);

  // Simple diff algorithm (LCS-based)
  const computeDiff = useCallback((a: string, b: string): DiffLine[] => {
    const linesA = a.split('\n');
    const linesB = b.split('\n');
    const _result: DiffLine[] = [];

    // Build LCS table
    const m = linesA.length;
    const n = linesB.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const lineA = linesA[i - 1];
        const lineB = linesB[j - 1];
        const dpPrev = dp[i - 1];
        const dpCurrent = dp[i];
        if (lineA === lineB && dpPrev && dpCurrent) {
          dpCurrent[j] = (dpPrev[j - 1] ?? 0) + 1;
        } else if (dpPrev && dpCurrent) {
          dpCurrent[j] = Math.max(dpPrev[j] ?? 0, dpCurrent[j - 1] ?? 0);
        }
      }
    }

    // Backtrack to find diff
    let i = m;
    let j = n;
    const temp: DiffLine[] = [];

    while (i > 0 || j > 0) {
      const lineA = linesA[i - 1];
      const lineB = linesB[j - 1];
      const dpRow = dp[i];
      const dpPrevRow = dp[i - 1];

      if (i > 0 && j > 0 && lineA === lineB) {
        temp.unshift({
          type: 'unchanged',
          content: lineA ?? '',
          oldLineNum: i,
          newLineNum: j,
        });
        i--;
        j--;
      } else if (
        j > 0 &&
        (i === 0 || (dpRow && dpPrevRow && (dpRow[j - 1] ?? 0) >= (dpPrevRow[j] ?? 0)))
      ) {
        temp.unshift({
          type: 'added',
          content: lineB ?? '',
          newLineNum: j,
        });
        j--;
      } else if (i > 0) {
        temp.unshift({
          type: 'removed',
          content: lineA ?? '',
          oldLineNum: i,
        });
        i--;
      }
    }

    return temp;
  }, []);

  useEffect(() => {
    setDiffLines(computeDiff(textA, textB));
  }, [textA, textB, computeDiff]);

  const swapTexts = () => {
    const temp = textA;
    setTextA(textB);
    setTextB(temp);
  };

  const clearAll = () => {
    setTextA('');
    setTextB('');
  };

  const resetToSample = () => {
    setTextA(sampleTextA);
    setTextB(sampleTextB);
  };

  const copyDiff = async () => {
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
  };

  const stats = {
    added: diffLines.filter((l) => l.type === 'added').length,
    removed: diffLines.filter((l) => l.type === 'removed').length,
    unchanged: diffLines.filter((l) => l.type === 'unchanged').length,
  };

  const getLineClass = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-500/20 border-l-4 border-green-500';
      case 'removed':
        return 'bg-red-500/20 border-l-4 border-red-500';
      default:
        return 'bg-transparent border-l-4 border-transparent';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Diff Viewer
              </CardTitle>
              <CardDescription>Compare and diff text or code side-by-side</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/20">
                <Plus className="mr-1 h-3 w-3" />
                {stats.added}
              </Badge>
              <Badge variant="outline" className="bg-red-500/20">
                <Minus className="mr-1 h-3 w-3" />
                {stats.removed}
              </Badge>
              <Badge variant="outline">{stats.unchanged} unchanged</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Label>View:</Label>
              <Select value={diffMode} onValueChange={(v) => setDiffMode(v as DiffMode)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="split">Split</SelectItem>
                  <SelectItem value="unified">Unified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={swapTexts}>
                <Swap className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetToSample}>
                <ArrowsClockwise className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                <Trash className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={copyDiff}>
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Input Areas */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                Original (A)
              </Label>
              <Textarea
                value={textA}
                onChange={(e) => setTextA(e.target.value)}
                className="h-48 resize-none font-mono text-sm"
                placeholder="Paste original text here..."
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                Modified (B)
              </Label>
              <Textarea
                value={textB}
                onChange={(e) => setTextB(e.target.value)}
                className="h-48 resize-none font-mono text-sm"
                placeholder="Paste modified text here..."
              />
            </div>
          </div>

          {/* Diff Output */}
          <div className="space-y-2">
            <Label>Diff Result</Label>
            <ScrollArea className="h-80 rounded-md border bg-muted/30">
              {diffMode === 'split' ? (
                <div className="grid grid-cols-2">
                  {/* Left side - Original */}
                  <div className="border-r">
                    {diffLines
                      .filter((l) => l.type !== 'added')
                      .map((line, index) => (
                        <div
                          key={`left-${index}`}
                          className={`flex font-mono text-sm ${getLineClass(line.type)}`}
                        >
                          <span className="w-10 shrink-0 select-none border-r bg-muted/50 px-2 text-right text-muted-foreground">
                            {line.oldLineNum || ''}
                          </span>
                          <span className="w-6 shrink-0 select-none text-center text-muted-foreground">
                            {line.type === 'removed' ? '-' : ' '}
                          </span>
                          <pre className="flex-1 overflow-x-auto whitespace-pre px-2">
                            {line.content}
                          </pre>
                        </div>
                      ))}
                  </div>
                  {/* Right side - Modified */}
                  <div>
                    {diffLines
                      .filter((l) => l.type !== 'removed')
                      .map((line, index) => (
                        <div
                          key={`right-${index}`}
                          className={`flex font-mono text-sm ${getLineClass(line.type)}`}
                        >
                          <span className="w-10 shrink-0 select-none border-r bg-muted/50 px-2 text-right text-muted-foreground">
                            {line.newLineNum || ''}
                          </span>
                          <span className="w-6 shrink-0 select-none text-center text-muted-foreground">
                            {line.type === 'added' ? '+' : ' '}
                          </span>
                          <pre className="flex-1 overflow-x-auto whitespace-pre px-2">
                            {line.content}
                          </pre>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div>
                  {diffLines.map((line, index) => (
                    <div
                      key={`unified-${index}`}
                      className={`flex font-mono text-sm ${getLineClass(line.type)}`}
                    >
                      <span className="w-10 shrink-0 select-none border-r bg-muted/50 px-2 text-right text-muted-foreground">
                        {line.oldLineNum || ''}
                      </span>
                      <span className="w-10 shrink-0 select-none border-r bg-muted/50 px-2 text-right text-muted-foreground">
                        {line.newLineNum || ''}
                      </span>
                      <span className="w-6 shrink-0 select-none text-center text-muted-foreground">
                        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                      </span>
                      <pre className="flex-1 overflow-x-auto whitespace-pre px-2">
                        {line.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiffViewer;
