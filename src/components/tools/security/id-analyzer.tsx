'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IdentificationBadge, Info } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

interface DetectionResult {
  type: string;
  confidence: 'high' | 'medium' | 'low';
  details: string[];
}

const parseSnowflake = (id: string) => {
  try {
    const value = BigInt(id);
    const discordEpoch = 1420070400000n;
    const timestamp = (value >> 22n) + discordEpoch;
    return new Date(Number(timestamp)).toISOString();
  } catch {
    return null;
  }
};

const parseObjectId = (id: string) => {
  const timestampHex = id.slice(0, 8);
  const timestamp = Number.parseInt(timestampHex, 16) * 1000;
  return new Date(timestamp).toISOString();
};

const detectId = (input: string): DetectionResult[] => {
  const value = input.trim();
  if (!value) return [];
  const results: DetectionResult[] = [];

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    results.push({
      type: 'UUID v4',
      confidence: 'high',
      details: ['Version 4 UUID', 'Random-based'],
    });
  } else if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    results.push({ type: 'UUID', confidence: 'high', details: ['Variant RFC 4122'] });
  }

  if (/^[0-9A-HJKMNP-TV-Z]{26}$/.test(value)) {
    results.push({ type: 'ULID', confidence: 'high', details: ['26-character Crockford Base32'] });
  }

  if (/^[0-9]{17,20}$/.test(value)) {
    const ts = parseSnowflake(value);
    results.push({
      type: 'Snowflake ID',
      confidence: 'medium',
      details: ts ? [`Timestamp: ${ts}`] : ['Discord/Twitter style 64-bit snowflake'],
    });
  }

  if (/^[0-9a-f]{24}$/i.test(value)) {
    results.push({
      type: 'MongoDB ObjectId',
      confidence: 'high',
      details: [`Timestamp: ${parseObjectId(value)}`],
    });
  }

  if (/^[A-Za-z0-9-_]{10,}$/.test(value)) {
    results.push({
      type: 'Generic Token',
      confidence: 'low',
      details: ['Opaque identifier / API key-like'],
    });
  }

  return results;
};

export const IDAnalyzer = () => {
  const [input, setInput] = useState('550e8400-e29b-41d4-a716-446655440000');
  const [results, setResults] = useState<DetectionResult[]>(
    detectId('550e8400-e29b-41d4-a716-446655440000')
  );

  const summary = useMemo(() => {
    if (results.length === 0) return 'No recognizable ID pattern found yet.';
    return results.map((r) => `${r.type} (${r.confidence})`).join(', ');
  }, [results]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <IdentificationBadge className="h-5 w-5" /> ID Analyzer
        </CardTitle>
        <CardDescription>Detect and decode common identifier formats.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="id-input">Identifier</Label>
            <Input
              id="id-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste UUID, ULID, ObjectId, Snowflake..."
            />
            <div className="flex gap-2">
              <Button onClick={() => setResults(detectId(input))}>Analyze</Button>
              <Button variant="ghost" onClick={() => setInput('')}>
                Clear
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-3 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" /> Summary
            </div>
            <div className="mt-2 text-slate-800 dark:text-slate-200">{summary}</div>
          </div>
        </div>

        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-muted-foreground">
              No matches yet.
            </div>
          ) : (
            results.map((result) => (
              <div key={result.type} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{result.type}</div>
                    <div className="text-muted-foreground text-sm">
                      Confidence: {result.confidence}
                    </div>
                  </div>
                  <IdentificationBadge className="h-5 w-5 text-muted-foreground" />
                </div>
                <Textarea
                  readOnly
                  className="mt-3 h-24 text-sm"
                  value={result.details.join('\n') || 'No extra metadata'}
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IDAnalyzer;
