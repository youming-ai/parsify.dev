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
import { useEffect, useRef, useState } from 'react';

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

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(new URL('./diff-worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const payload = event.data as { id: number; diffLines: DiffLine[] };
      if (payload.id !== requestIdRef.current) {
        return;
      }
      setDiffLines(payload.diffLines);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) {
      return;
    }

    requestIdRef.current += 1;
    const id = requestIdRef.current;
    worker.postMessage({ id, a: textA, b: textB });
  }, [textA, textB]);

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
                className="h-[300px] resize-none font-mono text-sm"
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
                className="h-[300px] resize-none font-mono text-sm"
                placeholder="Paste modified text here..."
              />
            </div>
          </div>

          {/* Diff Output */}
          <div className="space-y-2">
            <Label>Diff Result</Label>
            <ScrollArea className="h-[650px] rounded-md border bg-muted/30">
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
