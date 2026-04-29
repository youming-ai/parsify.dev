'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { chunkText } from '@/lib/llm/text-chunker';
import { useMemo, useState } from 'react';

export function TextChunker() {
  const [text, setText] = useState('Paste a long document here to split it into RAG-ready chunks.');
  const [chunkSize, setChunkSize] = useState(800);
  const [overlap, setOverlap] = useState(120);
  const chunks = useMemo(() => chunkText(text, { chunkSize, overlap }), [text, chunkSize, overlap]);
  const jsonl = chunks.map((chunk) => JSON.stringify(chunk)).join('\n');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token-Aware Text Chunker</CardTitle>
        <CardDescription>
          Split local text into chunks with offsets and estimated token counts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>Chunk size</Label>
            <Input
              type="number"
              value={chunkSize}
              onChange={(event) => setChunkSize(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Overlap</Label>
            <Input
              type="number"
              value={overlap}
              onChange={(event) => setOverlap(Number(event.target.value))}
            />
          </div>
        </div>
        <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={10} />
        <p className="text-sm text-muted-foreground">Generated {chunks.length} chunks.</p>
        <Textarea value={jsonl} readOnly rows={10} />
      </CardContent>
    </Card>
  );
}
