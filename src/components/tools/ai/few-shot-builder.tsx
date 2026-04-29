'use client';

import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type FewShotExample, renderFewShotPrompt } from '@/lib/llm/few-shot-builder';
import { useMemo, useState } from 'react';

export function FewShotBuilder() {
  const [task, setTask] = useState('');
  const [examples, setExamples] = useState<FewShotExample[]>([{ input: '', output: '' }]);
  const [style, setStyle] = useState<'xml' | 'json' | 'markdown' | 'text'>('xml');

  const result = useMemo(
    () => renderFewShotPrompt({ task, examples, style }),
    [task, examples, style]
  );

  const addExample = () => setExamples((prev) => [...prev, { input: '', output: '' }]);
  const removeExample = (index: number) =>
    setExamples((prev) => prev.filter((_, i) => i !== index));
  const updateExample = (index: number, field: 'input' | 'output', value: string) =>
    setExamples((prev) => prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Few-shot Builder</CardTitle>
          <CardDescription>
            Generate structured few-shot prompts from task descriptions and input/output examples.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Task description</Label>
            <Input
              value={task}
              onChange={(event) => setTask(event.target.value)}
              placeholder="e.g. Translate English to Spanish"
            />
          </div>
          <div className="space-y-2">
            <Label>Output style</Label>
            <Select
              value={style}
              onValueChange={(value) => setStyle(value as 'xml' | 'json' | 'markdown' | 'text')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="text">Plain text</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Examples</CardTitle>
            <CardDescription>Add input/output pairs for few-shot prompting.</CardDescription>
          </div>
          <Button type="button" onClick={addExample} size="sm">
            Add example
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {examples.map((ex, i) => (
            <div key={`ex-${i}`} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Example {i + 1}</span>
                {examples.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeExample(i)}>
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Textarea
                  value={ex.input}
                  onChange={(event) => updateExample(i, 'input', event.target.value)}
                  placeholder="Input..."
                  rows={3}
                />
                <Textarea
                  value={ex.output}
                  onChange={(event) => updateExample(i, 'output', event.target.value)}
                  placeholder="Expected output..."
                  rows={3}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricCard label="Examples" value={result.exampleCount} />
        <MetricCard label="Estimated tokens" value={result.estimatedTokens} />
        <MetricCard label="Status" value={result.recommendation} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={result.prompt} readOnly rows={12} />
        </CardContent>
      </Card>

      <RelatedTools toolId="few-shot-builder" />
    </div>
  );
}
