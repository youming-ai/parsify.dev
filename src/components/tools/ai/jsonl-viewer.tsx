'use client';

import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseJsonl, updateJsonlRecord } from '@/lib/llm/jsonl';
import { useMemo, useState } from 'react';

export function JsonlViewer() {
  const [text, setText] = useState('');
  const [editIndex, setEditIndex] = useState(-1);
  const [editValue, setEditValue] = useState('');

  const data = useMemo(() => parseJsonl(text), [text]);

  const handleUpdate = (index: number) => {
    if (editValue.trim().length === 0) return;
    try {
      const updated = updateJsonlRecord(text, index, () => JSON.parse(editValue));
      setText(updated);
      setEditIndex(-1);
      setEditValue('');
    } catch (_err) {
      // invalid json, ignore
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>JSONL Viewer / Editor</CardTitle>
          <CardDescription>
            Inspect, validate, and lightly edit JSONL datasets in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={
              ' Paste JSONL, one JSON object per line\n{"a":1}\n{"b":2}\n{"name":"Alice","age":30}'
            }
            rows={12}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total Lines" value={data.records.length} />
        <MetricCard label="Valid" value={data.validCount} />
        <MetricCard label="Invalid" value={data.invalidCount} />
        <MetricCard label="Fields" value={Object.keys(data.fieldSummary).length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <CardDescription>{data.records.length} record(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.records.map((record, idx) => (
            <div key={idx} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Line {record.index + 1}</span>
                <Badge variant={record.valid ? 'secondary' : 'destructive'}>
                  {record.valid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
              {record.valid ? (
                <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                  {JSON.stringify(record.data, null, 2)}
                </pre>
              ) : (
                <p className="mt-2 text-xs text-red-600">{record.error}</p>
              )}
              {record.valid && (
                <div className="mt-2 flex items-center gap-2">
                  {editIndex === idx ? (
                    <>
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Edit as JSON"
                        className="text-xs"
                      />
                      <Button size="sm" variant="outline" onClick={() => handleUpdate(idx)}>
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditIndex(idx);
                        setEditValue(JSON.stringify(record.data));
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <RelatedTools toolId="jsonl-viewer" />
    </div>
  );
}
