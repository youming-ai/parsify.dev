'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowsClockwise,
  ArrowsInSimple,
  DownloadSimple,
  UploadSimple,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

const CompressionCtor = (globalThis as any).CompressionStream as
  | (new (
      format: string
    ) => any)
  | undefined;
const DecompressionCtor = (globalThis as any).DecompressionStream as
  | (new (
      format: string
    ) => any)
  | undefined;

const supportsCompression =
  typeof CompressionCtor !== 'undefined' && typeof DecompressionCtor !== 'undefined';

type Algorithm = 'gzip' | 'deflate';

const encodeBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

const decodeBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const compressText = async (input: string, algorithm: Algorithm) => {
  const readable = new Blob([input]).stream();
  const compressedStream = readable.pipeThrough(new CompressionCtor!(algorithm));
  const compressedBuffer = await new Response(compressedStream).arrayBuffer();
  return compressedBuffer;
};

const decompressToText = async (input: ArrayBuffer, algorithm: Algorithm) => {
  const readable = new Blob([input]).stream();
  const decompressedStream = readable.pipeThrough(new DecompressionCtor!(algorithm));
  return new Response(decompressedStream).text();
};

export const CompressionTool = () => {
  const [algorithm, setAlgorithm] = useState<Algorithm>('gzip');
  const [rawInput, setRawInput] = useState('Hello Parsify! Compress me with gzip or deflate.');
  const [compressed, setCompressed] = useState('');
  const [decompressed, setDecompressed] = useState('');
  const [stats, setStats] = useState<{
    original: number;
    compressed: number;
  } | null>(null);
  const [error, setError] = useState('');

  const disabled = useMemo(() => !supportsCompression, []);

  const handleCompress = async () => {
    if (disabled) return;
    try {
      setError('');
      const buffer = await compressText(rawInput, algorithm);
      setCompressed(encodeBase64(buffer));
      setStats({ original: rawInput.length, compressed: buffer.byteLength });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed');
    }
  };

  const handleDecompress = async () => {
    if (disabled || !compressed.trim()) return;
    try {
      setError('');
      const buffer = decodeBase64(compressed.trim());
      const text = await decompressToText(buffer, algorithm);
      setDecompressed(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decompression failed');
    }
  };

  const handleDownload = () => {
    if (!compressed) return;
    const buffer = decodeBase64(compressed);
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compressed-${algorithm}.bin`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ArrowsInSimple className="h-5 w-5" /> Compression Tools
            </CardTitle>
            <CardDescription>Gzip/Deflate compress & decompress with size stats.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setRawInput('')}>
              <ArrowsClockwise className="mr-2 h-4 w-4" /> Clear
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!compressed}>
              <DownloadSimple className="mr-2 h-4 w-4" /> DownloadSimple
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!supportsCompression && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
            Browser CompressionStream/DecompressionStream not available. Try a Chromium-based
            browser.
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">{error}</div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <Label htmlFor="algorithm">Algorithm</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={algorithm === 'gzip' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAlgorithm('gzip')}
              >
                Gzip
              </Button>
              <Button
                type="button"
                variant={algorithm === 'deflate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAlgorithm('deflate')}
              >
                Deflate
              </Button>
            </div>
            <Label htmlFor="raw-input">Input</Label>
            <Textarea
              id="raw-input"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="min-h-[400px]"
              placeholder="Text to compress"
            />
            <Button onClick={handleCompress} disabled={disabled}>
              <UploadSimple className="mr-2 h-4 w-4" /> Compress
            </Button>
            {stats && (
              <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                <div>Original: {stats.original} bytes</div>
                <div>Compressed: {stats.compressed} bytes</div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Tabs defaultValue="compressed">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="compressed">Compressed (Base64)</TabsTrigger>
                <TabsTrigger value="decompressed">Decompressed</TabsTrigger>
              </TabsList>

              <TabsContent value="compressed" className="mt-2 space-y-2">
                <Textarea
                  value={compressed}
                  onChange={(e) => setCompressed(e.target.value)}
                  className="min-h-[400px] font-mono"
                  placeholder="Compressed Base64 output"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecompress}
                  disabled={disabled || !compressed.trim()}
                >
                  Decompress
                </Button>
              </TabsContent>

              <TabsContent value="decompressed" className="mt-2">
                <Textarea
                  value={decompressed}
                  readOnly
                  className="min-h-[400px]"
                  placeholder="Decompressed text"
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompressionTool;
