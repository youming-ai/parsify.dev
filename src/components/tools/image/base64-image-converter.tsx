'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowsClockwise, Copy, DownloadSimple, Image } from '@phosphor-icons/react';
import { useCallback, useRef, useState } from 'react';

interface PreviewImageProps {
  src?: string;
  alt: string;
}

const PreviewImage = ({ src, alt }: PreviewImageProps) => {
  if (!src)
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
        No preview yet
      </div>
    );

  return (
    <div className="overflow-hidden rounded-lg border bg-muted/30">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-48 w-full bg-white object-contain" />
    </div>
  );
};

export const Base64ImageConverter = () => {
  const [base64Output, setBase64Output] = useState('');
  const [decodedPreview, setDecodedPreview] = useState('');
  const [encodePreview, setEncodePreview] = useState('');
  const [base64Input, setBase64Input] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toBase64 = useCallback(async (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const encoded = await toBase64(file);
        setBase64Output(encoded);
        setEncodePreview(encoded);
      } catch (error) {
        console.error(error);
      }
    },
    [toBase64]
  );

  const normalizeBase64 = (value: string) => {
    if (!value.trim()) return '';
    if (value.startsWith('data:')) return value.trim();
    return `data:image/png;base64,${value.trim()}`;
  };

  const handleDecode = useCallback(() => {
    const normalized = normalizeBase64(base64Input);
    setDecodedPreview(normalized);
  }, [base64Input]);

  const handleCopy = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error('Clipboard copy failed', error);
    }
  };

  const handleDownload = async () => {
    if (!decodedPreview && !encodePreview) return;
    const target = decodedPreview || encodePreview;
    try {
      const response = await fetch(target);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'image.png';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('DownloadSimple failed', error);
    }
  };

  const handleReset = () => {
    setBase64Output('');
    setEncodePreview('');
    setBase64Input('');
    setDecodedPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Image className="h-5 w-5" />
              Base64 Image Tools
            </CardTitle>
            <CardDescription>
              Convert images to Base64 strings and decode Base64 back to images with live preview.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <ArrowsClockwise className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              disabled={!decodedPreview && !encodePreview}
            >
              <DownloadSimple className="mr-2 h-4 w-4" /> DownloadSimple
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="encode" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encode">Encode (Image → Base64)</TabsTrigger>
            <TabsTrigger value="decode">Decode (Base64 → Image)</TabsTrigger>
          </TabsList>

          <TabsContent value="encode" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="image-file">Upload image</Label>
                <Input
                  ref={fileInputRef}
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <PreviewImage src={encodePreview} alt="Encoded preview" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Base64 output</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(base64Output)}
                    disabled={!base64Output}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
                <ScrollArea className="h-64">
                  <Textarea
                    value={base64Output}
                    onChange={(e) => setBase64Output(e.target.value)}
                    placeholder="Base64 string will appear here"
                    className="h-64 font-mono"
                  />
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="decode" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="base64-input">Base64 input</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDecode}
                    disabled={!base64Input.trim()}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Decode
                  </Button>
                </div>
                <Textarea
                  id="base64-input"
                  value={base64Input}
                  onChange={(e) => setBase64Input(e.target.value)}
                  placeholder="Paste Base64 string (with or without data URL prefix)"
                  className="h-64 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label>Image preview</Label>
                <PreviewImage src={decodedPreview} alt="Decoded preview" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Base64ImageConverter;
