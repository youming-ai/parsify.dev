'use client';

import { Badge } from '@/components/ui/badge';
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
import { ArrowsClockwise, Check, Copy, Fingerprint, Trash } from '@phosphor-icons/react';
import { useCallback, useState } from 'react';

type IdType = 'uuid-v4' | 'uuid-v1' | 'uuid-v7' | 'ulid' | 'nanoid' | 'ksuid';

interface GeneratedId {
  id: string;
  type: IdType;
  timestamp: Date;
}

// UUID v4 generator
function generateUUIDv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// UUID v1 (time-based) generator - simplified version
function generateUUIDv1(): string {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0');
  const clockSeq = Math.floor(Math.random() * 16384);
  const node = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
  ).join('');

  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-1${timeHex.slice(12, 15)}-${(
    (clockSeq >> 8) |
    0x80
  )
    .toString(16)
    .padStart(2, '0')}${(clockSeq & 0xff).toString(16).padStart(2, '0')}-${node}`;
}

// UUID v7 (Unix timestamp-based) generator
function generateUUIDv7(): string {
  const timestamp = Date.now();
  const timeHex = timestamp.toString(16).padStart(12, '0');
  const random1 = Math.floor(Math.random() * 4096)
    .toString(16)
    .padStart(3, '0');
  const random2 = Math.floor(Math.random() * 16384)
    .toString(16)
    .padStart(4, '0');
  const random3 = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-7${random1}-${((Number.parseInt(random2[0] ?? '0', 16) & 0x3) | 0x8).toString(16)}${random2.slice(1)}-${random3}`;
}

// ULID generator
function generateULID(): string {
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const timestamp = Date.now();
  let ulid = '';

  // Encode timestamp (10 characters)
  let ts = timestamp;
  for (let i = 0; i < 10; i++) {
    ulid = ENCODING[ts % 32] + ulid;
    ts = Math.floor(ts / 32);
  }

  // Encode random (16 characters)
  for (let i = 0; i < 16; i++) {
    ulid += ENCODING[Math.floor(Math.random() * 32)];
  }

  return ulid;
}

// NanoID generator
function generateNanoID(size = 21): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let id = '';
  for (let i = 0; i < size; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}

// KSUID generator (simplified)
function generateKSUID(): string {
  const EPOCH = 1400000000; // May 13, 2014
  const timestamp = Math.floor(Date.now() / 1000) - EPOCH;
  const payload = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));

  const bytes = [
    (timestamp >> 24) & 0xff,
    (timestamp >> 16) & 0xff,
    (timestamp >> 8) & 0xff,
    timestamp & 0xff,
    ...payload,
  ];

  // Base62 encoding
  const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let num = BigInt(0);
  for (const byte of bytes) {
    num = num * BigInt(256) + BigInt(byte);
  }

  let encoded = '';
  while (num > 0) {
    encoded = BASE62[Number(num % BigInt(62))] + encoded;
    num = num / BigInt(62);
  }

  return encoded.padStart(27, '0');
}

const ID_TYPES: { value: IdType; label: string; description: string }[] = [
  { value: 'uuid-v4', label: 'UUID v4', description: 'Random UUID (most common)' },
  { value: 'uuid-v1', label: 'UUID v1', description: 'Time-based UUID' },
  { value: 'uuid-v7', label: 'UUID v7', description: 'Unix timestamp UUID (sortable)' },
  { value: 'ulid', label: 'ULID', description: 'Universally Unique Lexicographically Sortable ID' },
  { value: 'nanoid', label: 'Nano ID', description: 'Compact, URL-friendly unique ID' },
  { value: 'ksuid', label: 'KSUID', description: "K-Sortable Unique ID (Segment's ID)" },
];

export default function IDGeneratorPage() {
  const [idType, setIdType] = useState<IdType>('uuid-v4');
  const [count, setCount] = useState(5);
  const [generatedIds, setGeneratedIds] = useState<GeneratedId[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateId = useCallback((type: IdType): string => {
    switch (type) {
      case 'uuid-v4':
        return generateUUIDv4();
      case 'uuid-v1':
        return generateUUIDv1();
      case 'uuid-v7':
        return generateUUIDv7();
      case 'ulid':
        return generateULID();
      case 'nanoid':
        return generateNanoID();
      case 'ksuid':
        return generateKSUID();
      default:
        return generateUUIDv4();
    }
  }, []);

  const handleGenerate = useCallback(() => {
    const newIds: GeneratedId[] = Array.from({ length: count }, () => ({
      id: generateId(idType),
      type: idType,
      timestamp: new Date(),
    }));
    setGeneratedIds((prev) => [...newIds, ...prev].slice(0, 100)); // Keep max 100
  }, [idType, count, generateId]);

  const handleCopy = useCallback(async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCopyAll = useCallback(async () => {
    const allIds = generatedIds.map((g) => g.id).join('\n');
    await navigator.clipboard.writeText(allIds);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  }, [generatedIds]);

  const handleClear = useCallback(() => {
    setGeneratedIds([]);
  }, []);

  const selectedTypeInfo = ID_TYPES.find((t) => t.value === idType);

  return (
    <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
      <Card className="rounded-xl border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>ID Generator</CardTitle>
                <CardDescription>
                  Generate UUIDs, ULIDs, Nano IDs, and more unique identifiers
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Batch</Badge>
              <Badge variant="outline">Offline</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-muted/30 p-4">
            <div className="space-y-2">
              <Label>ID Type</Label>
              <Select value={idType} onValueChange={(v) => setIdType(v as IdType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ID_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Count</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) =>
                  setCount(Math.min(50, Math.max(1, Number.parseInt(e.target.value) || 1)))
                }
                className="w-[100px]"
              />
            </div>

            <Button onClick={handleGenerate}>
              <ArrowsClockwise className="mr-2 h-4 w-4" />
              Generate
            </Button>

            {generatedIds.length > 0 && (
              <>
                <Button variant="outline" onClick={handleCopyAll}>
                  {copiedId === 'all' ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copiedId === 'all' ? 'Copied!' : 'Copy All'}
                </Button>
                <Button variant="ghost" onClick={handleClear}>
                  <Trash className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </>
            )}
          </div>

          {/* Type Description */}
          {selectedTypeInfo && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>{selectedTypeInfo.label}:</strong> {selectedTypeInfo.description}
              </p>
            </div>
          )}

          {/* Generated IDs */}
          {generatedIds.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated IDs ({generatedIds.length})</Label>
              </div>
              <div className="max-h-[400px] overflow-auto rounded-lg border bg-muted/20 p-2">
                {generatedIds.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="group flex items-center justify-between rounded px-3 py-2 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <code className="font-mono text-sm">{item.id}</code>
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item.id)}
                      className="opacity-0 group-hover:opacity-100"
                    >
                      {copiedId === item.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20">
              <p className="text-sm text-muted-foreground">
                Click "Generate" to create unique identifiers
              </p>
            </div>
          )}

          {/* ID Type Reference */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-medium">ID Types Reference</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ID_TYPES.map((type) => (
                <div key={type.value} className="rounded-lg bg-muted/20 p-3">
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
